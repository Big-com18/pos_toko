-- =====================================================================
-- PATCH: modal (harga beli) dan keuntungan
-- Aman dijalankan di database yang sudah berisi data (tidak menghapus apa pun).
-- Jalankan SELURUHNYA sekali di Supabase SQL Editor.
-- =====================================================================

-- 1. Tabel modal
-- Modal (harga beli) per barang. Hanya owner yang bisa melihat/mengubah.
-- cost_price = modal per satuan eceran (dipakai menghitung untung)
-- cost_total + cost_qty = yang diketik owner (misal beli 80.000 dapat 12 pcs); cost_price dihitung otomatis
create table if not exists product_costs (
  product_id uuid primary key references products(id) on delete cascade,
  cost_price numeric not null check (cost_price >= 0),  -- modal per satuan eceran (hasil hitung otomatis)
  cost_total numeric check (cost_total >= 0),           -- total harga beli yang diketik owner (misal 80.000)
  cost_qty numeric check (cost_qty > 0)                 -- jumlah satuan eceran yang didapat (misal 12)
);

-- Kalau patch modal versi sebelumnya sudah pernah dijalankan: sesuaikan kolomnya
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_costs' and column_name = 'cost_pack'
  ) then
    alter table public.product_costs rename column cost_pack to cost_total;
  end if;
end $$;
alter table product_costs add column if not exists cost_total numeric check (cost_total >= 0);
alter table product_costs add column if not exists cost_qty numeric check (cost_qty > 0);

-- Modal yang "dibekukan" saat transaksi terjadi, supaya laporan lama tidak berubah
-- kalau modal diubah di kemudian hari.
create table if not exists sale_item_costs (
  sale_item_id uuid primary key references sale_items(id) on delete cascade,
  cost_subtotal numeric not null
);

-- 2. Keamanan: modal hanya boleh dilihat owner
alter table product_costs enable row level security;
alter table sale_item_costs enable row level security;

drop policy if exists "costs_owner_all" on product_costs;
create policy "costs_owner_all" on product_costs
  for all to authenticated using (is_owner()) with check (is_owner());

drop policy if exists "item_costs_owner_select" on sale_item_costs;
create policy "item_costs_owner_select" on sale_item_costs
  for select to authenticated using (is_owner());

-- 3. Fungsi catat penjualan (versi baru: ikut menyimpan modal)
create or replace function create_sale(p_note text, p_items jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_sale_id uuid;
  v_item jsonb;
  v_item_id uuid;
  v_prod products%rowtype;
  v_qty numeric;
  v_mode text;
  v_price numeric;
  v_mult numeric;
  v_label text;
  v_sub numeric;
  v_cost numeric;
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
    values (v_sale_id, v_prod.id, v_mode, v_label, v_qty, v_price, v_qty * v_mult, v_sub)
    returning id into v_item_id;

    -- simpan modal saat ini (kalau owner sudah mengisinya)
    select cost_price into v_cost from product_costs where product_id = v_prod.id;
    if found then
      insert into sale_item_costs (sale_item_id, cost_subtotal)
      values (v_item_id, round(v_qty * v_mult * v_cost));
    end if;

    insert into stock_movements (product_id, type, qty, note, sale_id, created_by)
    values (v_prod.id, 'out', v_qty * v_mult, 'penjualan', v_sale_id, v_uid);

    v_total := v_total + v_sub;
  end loop;

  update sales set total = v_total where id = v_sale_id;
  return v_sale_id;
end; $$;

-- 4. Fungsi laporan (versi baru: ada kolom keuntungan)
drop function if exists report_daily(date, date);
create or replace function report_daily(p_from date, p_to date)
returns table (
  report_day date,
  total_revenue numeric,
  trx_count bigint,
  total_profit numeric,
  uncosted_revenue numeric
)
language sql stable as $$
  select d.day, d.rev, d.trx, coalesce(p.profit, 0), coalesce(p.unc, 0)
  from (
    select (s.sold_at at time zone 'Asia/Makassar')::date as day,
           coalesce(sum(s.total), 0) as rev,
           count(*) as trx
    from sales s
    where s.voided_at is null
      and (s.sold_at at time zone 'Asia/Makassar')::date between p_from and p_to
    group by 1
  ) d
  left join (
    select (s.sold_at at time zone 'Asia/Makassar')::date as day,
           sum(case when c.sale_item_id is not null then si.subtotal - c.cost_subtotal else 0 end) as profit,
           sum(case when c.sale_item_id is null then si.subtotal else 0 end) as unc
    from sales s
    join sale_items si on si.sale_id = s.id
    left join sale_item_costs c on c.sale_item_id = si.id
    where s.voided_at is null
      and (s.sold_at at time zone 'Asia/Makassar')::date between p_from and p_to
    group by 1
  ) p on p.day = d.day
  order by d.day;
$$;

drop function if exists report_products(date, date);
create or replace function report_products(p_from date, p_to date)
returns table (
  product_id uuid,
  product_name text,
  qty_base numeric,
  revenue numeric,
  profit numeric
)
language sql stable as $$
  select pr.id, pr.name, sum(si.base_qty), sum(si.subtotal),
         sum(case when c.sale_item_id is not null then si.subtotal - c.cost_subtotal end)
  from sale_items si
  join sales s on s.id = si.sale_id
  join products pr on pr.id = si.product_id
  left join sale_item_costs c on c.sale_item_id = si.id
  where s.voided_at is null
    and (s.sold_at at time zone 'Asia/Makassar')::date between p_from and p_to
  group by pr.id, pr.name
  order by sum(si.subtotal) desc;
$$;

-- 5. Hak akses fungsi
revoke execute on function report_daily(date, date) from public, anon;
revoke execute on function report_products(date, date) from public, anon;
grant execute on function report_daily(date, date) to authenticated;
grant execute on function report_products(date, date) to authenticated;
