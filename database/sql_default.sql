-- 1. Barang
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  base_unit text not null default 'pcs',
  min_stock numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Paket jual (per pcs, paket 5.000, dll)
create table sale_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,                       -- "Per pcs", "Paket 5.000"
  price numeric not null check (price >= 0),
  base_qty numeric not null check (base_qty > 0), -- isi dalam satuan dasar
  is_active boolean not null default true
);

-- 3. Buku stok
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  type text not null check (type in ('in','out','adjust')),
  qty numeric not null,          -- 'in' & 'out' positif, 'adjust' boleh +/-
  note text,
  sale_id uuid,
  created_at timestamptz not null default now()
);

-- 4. Transaksi
create table sales (
  id uuid primary key default gen_random_uuid(),
  sold_at timestamptz not null default now(),
  note text
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  sale_option_id uuid references sale_options(id),
  quantity numeric not null check (quantity > 0), -- jumlah paket
  price_snapshot numeric not null,
  base_qty_snapshot numeric not null
);

-- 5. Menu harian
create table daily_menu (
  id uuid primary key default gen_random_uuid(),
  menu_date date not null default current_date,
  product_id uuid not null references products(id),
  unique (menu_date, product_id)
);

-- Trigger: tiap item terjual otomatis mengurangi stok
create or replace function fn_sale_item_to_stock() returns trigger as $$
begin
  insert into stock_movements (product_id, type, qty, sale_id, note)
  values (new.product_id, 'out', new.quantity * new.base_qty_snapshot, new.sale_id, 'penjualan');
  return new;
end; $$ language plpgsql;

create trigger trg_sale_item_stock
after insert on sale_items
for each row execute function fn_sale_item_to_stock();

-- View stok saat ini
create view v_stock as
select p.id, p.name, p.category, p.base_unit, p.min_stock,
  coalesce(sum(case m.type
    when 'in' then m.qty
    when 'out' then -m.qty
    else m.qty end), 0) as stock,
  coalesce(sum(case m.type
    when 'in' then m.qty
    when 'out' then -m.qty
    else m.qty end), 0) <= p.min_stock as is_low
from products p
left join stock_movements m on m.product_id = p.id
group by p.id;

-- View ringkasan harian
create view v_daily_summary as
select (s.sold_at at time zone 'Asia/Makassar')::date as day,
  p.name as product,
  sum(si.quantity * si.base_qty_snapshot) as total_base_qty,
  sum(si.quantity * si.price_snapshot) as revenue
from sale_items si
join sales s on s.id = si.sale_id
join products p on p.id = si.product_id
group by 1, 2;


--10/30/2026
