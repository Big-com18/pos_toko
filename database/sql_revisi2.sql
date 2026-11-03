-- =====================================================================
-- TOKO STOK - SKEMA LENGKAP (v3, konsep warung kelontong)
-- Jalankan SELURUHNYA sekali di Supabase SQL Editor.
-- PERHATIAN: Bagian 0 menghapus tabel lama beserta isinya.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. BERSIHKAN OBJEK LAMA
-- ---------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop view if exists v_stock cascade;
drop view if exists v_daily_summary cascade;
drop function if exists create_sale(text, jsonb) cascade;
drop function if exists create_sale_simple(text, jsonb) cascade;
drop function if exists void_sale(uuid) cascade;
drop function if exists report_daily(date, date) cascade;
drop function if exists report_products(date, date) cascade;
drop function if exists fn_sale_item_to_stock() cascade;
drop function if exists handle_new_user() cascade;
drop function if exists is_admin() cascade;
drop function if exists is_owner() cascade;
drop table if exists sale_items cascade;
drop table if exists sales cascade;
drop table if exists stock_movements cascade;
drop table if exists daily_menu cascade;
drop table if exists sale_options cascade;
drop table if exists products cascade;
drop table if exists profiles cascade;

-- ---------------------------------------------------------------------
-- 1. TABEL
-- ---------------------------------------------------------------------

-- Profil pengguna (peran: owner atau kasir)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'kasir' check (role in ('owner','kasir')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Barang. Stok SELALU dihitung dalam satuan eceran (kolom unit).
-- Contoh Gelas : unit='pcs', unit_price=1000, pack_unit='pak', pack_size=12, pack_price=12000
--   -> beli 2 pcs = 2.000, beli 1 pak = 12.000 (stok berkurang 12 pcs)
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  unit text not null default 'pcs',                                  -- satuan eceran
  unit_price numeric not null default 0 check (unit_price >= 0),     -- harga per satuan eceran
  pack_unit text,                                                    -- satuan besar (pak, dus, ...)
  pack_size numeric check (pack_size > 0),                           -- isi satuan eceran per satuan besar
  pack_price numeric check (pack_price >= 0),                        -- harga per satuan besar (kosong = harga eceran x isi)
  min_stock numeric not null default 0 check (min_stock >= 0),       -- batas stok hampir habis
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint products_pack_complete check (
    (pack_unit is null and pack_size is null and pack_price is null)
    or (pack_unit is not null and pack_size is not null)
  )
);

-- Transaksi penjualan (hanya dibuat lewat fungsi create_sale)
create table sales (
  id uuid primary key default gen_random_uuid(),
  sold_at timestamptz not null default now(),
  total numeric not null default 0,
  note text,
  created_by uuid default auth.uid() references profiles(id) on delete set null,
  voided_at timestamptz,
  voided_by uuid references profiles(id) on delete set null
);

-- Rincian transaksi (harga disimpan sebagai snapshot)
create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  unit_type text not null check (unit_type in ('unit','pack')),
  unit_label text not null,                          -- 'pcs', 'pak', ...
  quantity numeric not null check (quantity > 0),    -- jumlah dalam satuan jual
  price numeric not null,                            -- harga per satuan jual saat itu
  base_qty numeric not null,                         -- jumlah dalam satuan eceran (untuk stok)
  subtotal numeric not null
);

-- Buku stok: semua perubahan stok tercatat di sini (jumlah dalam satuan eceran)
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  type text not null check (type in ('in','out','adjust')),
  qty numeric not null,
  note text,
  sale_id uuid references sales(id) on delete set null,
  created_by uuid default auth.uid() references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint movement_qty_valid check (
    (type = 'adjust' and qty <> 0) or (type in ('in','out') and qty > 0)
  )
);

create index idx_products_name on products (lower(name));
create index idx_sales_sold_at on sales (sold_at);
create index idx_sales_created_by on sales (created_by);
create index idx_sale_items_sale on sale_items (sale_id);
create index idx_sale_items_product on sale_items (product_id);
create index idx_movements_product on stock_movements (product_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2. PENGGUNA & PERAN
-- ---------------------------------------------------------------------
create or replace function is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'owner' and is_active
  );
$$;

-- Saat ada user baru (daftar / dibuat di dashboard), profil dibuat otomatis.
-- Akun PERTAMA otomatis jadi owner, berikutnya kasir.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    case when exists (select 1 from public.profiles) then 'kasir' else 'owner' end
  );
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- Isi profil untuk akun yang SUDAH ada (yang paling lama jadi owner)
insert into profiles (id, full_name, email, role)
select u.id,
       coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
       u.email,
       case when row_number() over (order by u.created_at) = 1 then 'owner' else 'kasir' end
from auth.users u;

-- ---------------------------------------------------------------------
-- 3. VIEW STOK
-- ---------------------------------------------------------------------
create view v_stock with (security_invoker = true) as
select t.*, (t.stock <= t.min_stock) as is_low
from (
  select p.id, p.name, p.category, p.unit, p.pack_unit, p.pack_size,
         p.min_stock, p.is_active,
         coalesce(sum(case m.type when 'out' then -m.qty else m.qty end), 0) as stock
  from products p
  left join stock_movements m on m.product_id = p.id
  group by p.id
) t;

-- ---------------------------------------------------------------------
-- 4. KEAMANAN (ROW LEVEL SECURITY)
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table stock_movements enable row level security;

-- profiles: lihat profil sendiri (owner lihat semua); hanya owner yang boleh mengubah
create policy "profiles_select" on profiles
  for select to authenticated using (id = auth.uid() or is_owner());
create policy "profiles_update_owner" on profiles
  for update to authenticated using (is_owner()) with check (is_owner());

-- products: semua yang login boleh baca, hanya owner yang boleh tambah/ubah
create policy "products_select" on products
  for select to authenticated using (true);
create policy "products_write_owner" on products
  for all to authenticated using (is_owner()) with check (is_owner());

-- stock_movements: semua boleh baca, hanya owner yang boleh mencatat langsung
-- (stok keluar karena penjualan dicatat otomatis oleh fungsi create_sale)
create policy "movements_select" on stock_movements
  for select to authenticated using (true);
create policy "movements_insert_owner" on stock_movements
  for insert to authenticated with check (is_owner());

-- sales & sale_items: owner lihat semua, kasir hanya miliknya.
-- Tidak ada policy insert/update/delete: semua lewat fungsi di bawah.
create policy "sales_select" on sales
  for select to authenticated using (is_owner() or created_by = auth.uid());
create policy "sale_items_select" on sale_items
  for select to authenticated
  using (exists (select 1 from sales s where s.id = sale_items.sale_id));

-- ---------------------------------------------------------------------
-- 5. FUNGSI TRANSAKSI
-- ---------------------------------------------------------------------

-- Catat penjualan. Harga diambil dari database (tidak bisa dimanipulasi browser).
-- p_items: [{"product_id": "...", "unit_type": "unit" | "pack", "quantity": 2}, ...]
create or replace function create_sale(p_note text, p_items jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_sale_id uuid;
  v_item jsonb;
  v_prod products%rowtype;
  v_qty numeric;
  v_mode text;
  v_price numeric;
  v_mult numeric;
  v_label text;
  v_sub numeric;
  v_total numeric := 0;
begin
  if v_uid is null then
    raise exception 'Harus login terlebih dahulu';
  end if;
  if not exists (select 1 from profiles where id = v_uid and is_active) then
    raise exception 'Akun tidak aktif';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Data transaksi tidak valid';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Transaksi tidak boleh kosong';
  end if;

  insert into sales (note, created_by)
  values (nullif(trim(p_note), ''), v_uid)
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::numeric;
    v_mode := coalesce(v_item->>'unit_type', 'unit');

    if v_qty is null or v_qty <= 0 then
      raise exception 'Jumlah harus lebih dari 0';
    end if;

    select * into v_prod from products
    where id = (v_item->>'product_id')::uuid and is_active;
    if not found then
      raise exception 'Barang tidak ditemukan atau tidak aktif';
    end if;

    if v_mode = 'pack' then
      if v_prod.pack_unit is null or v_prod.pack_size is null then
        raise exception 'Barang "%" tidak punya satuan besar', v_prod.name;
      end if;
      v_price := coalesce(v_prod.pack_price, v_prod.unit_price * v_prod.pack_size);
      v_mult := v_prod.pack_size;
      v_label := v_prod.pack_unit;
    else
      v_mode := 'unit';
      v_price := v_prod.unit_price;
      v_mult := 1;
      v_label := v_prod.unit;
    end if;

    v_sub := round(v_qty * v_price);

    insert into sale_items (sale_id, product_id, unit_type, unit_label, quantity, price, base_qty, subtotal)
    values (v_sale_id, v_prod.id, v_mode, v_label, v_qty, v_price, v_qty * v_mult, v_sub);

    insert into stock_movements (product_id, type, qty, note, sale_id, created_by)
    values (v_prod.id, 'out', v_qty * v_mult, 'penjualan', v_sale_id, v_uid);

    v_total := v_total + v_sub;
  end loop;

  update sales set total = v_total where id = v_sale_id;
  return v_sale_id;
end; $$;

-- Batalkan transaksi (hanya owner). Stok dikembalikan otomatis.
create or replace function void_sale(p_sale_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_sale sales%rowtype;
begin
  if not is_owner() then
    raise exception 'Hanya owner yang boleh membatalkan transaksi';
  end if;

  select * into v_sale from sales where id = p_sale_id for update;
  if not found then
    raise exception 'Transaksi tidak ditemukan';
  end if;
  if v_sale.voided_at is not null then
    raise exception 'Transaksi sudah dibatalkan';
  end if;

  update sales set voided_at = now(), voided_by = auth.uid() where id = p_sale_id;

  insert into stock_movements (product_id, type, qty, note, sale_id, created_by)
  select product_id, 'in', base_qty, 'pembatalan transaksi', p_sale_id, auth.uid()
  from sale_items where sale_id = p_sale_id;
end; $$;

-- ---------------------------------------------------------------------
-- 6. FUNGSI LAPORAN (hari dihitung dalam WITA / Asia/Makassar)
-- ---------------------------------------------------------------------
create or replace function report_daily(p_from date, p_to date)
returns table (report_day date, total_revenue numeric, trx_count bigint)
language sql stable as $$
  select (s.sold_at at time zone 'Asia/Makassar')::date,
         coalesce(sum(s.total), 0),
         count(*)
  from sales s
  where s.voided_at is null
    and (s.sold_at at time zone 'Asia/Makassar')::date between p_from and p_to
  group by 1
  order by 1;
$$;

create or replace function report_products(p_from date, p_to date)
returns table (product_id uuid, product_name text, qty_base numeric, revenue numeric)
language sql stable as $$
  select p.id, p.name, sum(si.base_qty), sum(si.subtotal)
  from sale_items si
  join sales s on s.id = si.sale_id
  join products p on p.id = si.product_id
  where s.voided_at is null
    and (s.sold_at at time zone 'Asia/Makassar')::date between p_from and p_to
  group by p.id, p.name
  order by sum(si.subtotal) desc;
$$;

-- Hanya user yang login yang boleh memanggil fungsi
revoke execute on function create_sale(text, jsonb) from public, anon;
revoke execute on function void_sale(uuid) from public, anon;
revoke execute on function report_daily(date, date) from public, anon;
revoke execute on function report_products(date, date) from public, anon;
grant execute on function create_sale(text, jsonb) to authenticated;
grant execute on function void_sale(uuid) to authenticated;
grant execute on function report_daily(date, date) to authenticated;
grant execute on function report_products(date, date) to authenticated;