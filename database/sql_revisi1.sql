-- =========================================================
-- A. PROFIL & PERAN
-- =========================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'kasir' check (role in ('admin','kasir')),
  created_at timestamptz not null default now()
);

-- Saat ada user baru (daftar), profil dibuat otomatis.
-- Akun pertama yang terdaftar otomatis jadi admin, berikutnya kasir.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when exists (select 1 from public.profiles) then 'kasir' else 'admin' end
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- Isi profil untuk user yang SUDAH ada (yang paling lama jadi admin)
insert into profiles (id, full_name, role)
select u.id, split_part(u.email, '@', 1),
  case when row_number() over (order by u.created_at) = 1 then 'admin' else 'kasir' end
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id);

-- Helper: apakah user yang sedang login adalah admin?
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- =========================================================
-- B. TRIGGER STOK JADI SECURITY DEFINER
--    (supaya kasir bisa jual walau tidak boleh insert stok langsung)
-- =========================================================
create or replace function fn_sale_item_to_stock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into stock_movements (product_id, type, qty, sale_id, note)
  values (new.product_id, 'out', new.quantity * new.base_qty_snapshot, new.sale_id, 'penjualan');
  return new;
end; $$;

-- =========================================================
-- C. RLS BERBASIS PERAN
-- =========================================================
alter table profiles enable row level security;
alter table products enable row level security;
alter table sale_options enable row level security;
alter table stock_movements enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table daily_menu enable row level security;

-- Bersihkan policy lama
do $$
declare t text;
begin
  foreach t in array array['products','sale_options','stock_movements','sales','sale_items','daily_menu'] loop
    execute format('drop policy if exists "auth full access" on %I', t);
  end loop;
end $$;

-- profiles: lihat profil sendiri (admin lihat semua), hanya admin yang boleh ubah peran
drop policy if exists "profiles read" on profiles;
drop policy if exists "profiles admin update" on profiles;
create policy "profiles read" on profiles
  for select to authenticated using (id = auth.uid() or is_admin());
create policy "profiles admin update" on profiles
  for update to authenticated using (is_admin()) with check (is_admin());

-- products & sale_options: semua login boleh baca, hanya admin yang boleh ubah
do $$
declare t text;
begin
  foreach t in array array['products','sale_options'] loop
    execute format('drop policy if exists "read all" on %I', t);
    execute format('drop policy if exists "admin write" on %I', t);
    execute format('create policy "read all" on %I for select to authenticated using (true)', t);
    execute format('create policy "admin write" on %I for all to authenticated using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- daily_menu: admin dan kasir boleh baca dan atur
drop policy if exists "all access" on daily_menu;
create policy "all access" on daily_menu
  for all to authenticated using (true) with check (true);

-- stock_movements: semua baca; hanya admin yang input langsung (restock/koreksi)
drop policy if exists "read all" on stock_movements;
drop policy if exists "admin insert" on stock_movements;
create policy "read all" on stock_movements for select to authenticated using (true);
create policy "admin insert" on stock_movements for insert to authenticated with check (is_admin());

-- sales & sale_items: semua login boleh baca dan menambah, tidak boleh ubah/hapus
do $$
declare t text;
begin
  foreach t in array array['sales','sale_items'] loop
    execute format('drop policy if exists "read all" on %I', t);
    execute format('drop policy if exists "insert all" on %I', t);
    execute format('create policy "read all" on %I for select to authenticated using (true)', t);
    execute format('create policy "insert all" on %I for insert to authenticated with check (true)', t);
  end loop;
end $$;

-- View mengikuti hak akses pemanggil
alter view v_stock set (security_invoker = true);
alter view v_daily_summary set (security_invoker = true);

-- =========================================================
-- D. INDEX
-- =========================================================
create index if not exists idx_sale_options_product on sale_options(product_id);
create index if not exists idx_stock_movements_product on stock_movements(product_id, created_at desc);
create index if not exists idx_sale_items_sale on sale_items(sale_id);
create index if not exists idx_sales_sold_at on sales(sold_at);
create index if not exists idx_daily_menu_date on daily_menu(menu_date);

-- =========================================================
-- E. FUNGSI TRANSAKSI ATOMIK (dipanggil frontend)
-- =========================================================
create or replace function create_sale(p_note text, p_items jsonb)
returns uuid
language plpgsql as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_opt sale_options%rowtype;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Transaksi tidak boleh kosong';
  end if;

  insert into sales (note) values (p_note) returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_opt from sale_options
    where id = (v_item->>'sale_option_id')::uuid and is_active;

    if not found then
      raise exception 'Paket jual tidak ditemukan atau tidak aktif';
    end if;

    insert into sale_items (sale_id, product_id, sale_option_id, quantity, price_snapshot, base_qty_snapshot)
    values (v_sale_id, v_opt.product_id, v_opt.id, (v_item->>'quantity')::numeric, v_opt.price, v_opt.base_qty);
  end loop;

  return v_sale_id;
end; $$;

--10/31/2026