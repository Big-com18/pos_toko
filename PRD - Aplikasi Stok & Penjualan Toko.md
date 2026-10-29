# PRD: Aplikasi Stok & Penjualan Toko

Dokumen ini ditulis supaya bisa langsung diberikan ke AI lain atau developer lain tanpa penjelasan tambahan. Isinya: latar belakang, tujuan, fitur, skema database (SQL), arsitektur, struktur folder, dan tech stack.

**Status:** Draft v1\
**Pemilik produk:** Billy\
**Platform:** Web app (responsive, utamanya dipakai di HP dan laptop kasir)\
**Bahasa antarmuka:** Indonesia

## 1. Ringkasan

Aplikasi web sederhana untuk membantu pemilik toko mencatat dan meringkas stok barang serta penjualan harian. Toko menjual barang-barang kebutuhan seperti gelas, susu, plastik, karet, dan sejenisnya. Daftar barang lengkap belum final, jadi sistem harus fleksibel: barang baru bisa ditambah kapan saja tanpa mengubah struktur database maupun kode.

## 2. Masalah yang Ingin Diselesaikan

1. Pembeli tidak membeli dengan cara yang seragam. Ada yang beli dengan nominal (misalnya Rp5.000 dapat 6 gelas), ada yang beli per pcs.
2. Kalau stok dicatat terpisah untuk tiap cara jual, angkanya mudah tidak sinkron.
3. Pemilik toko butuh ringkasan cepat: sisa stok berapa, apa yang terjual hari ini, barang mana yang hampir habis.
4. Daftar barang belum lengkap, jadi sistem tidak boleh kaku.

## 3. Tujuan dan Non-Tujuan

**Tujuan**

- Mencatat stok dengan satu sumber kebenaran (satu angka stok per barang, dalam satuan dasar).
- Mendukung banyak cara jual per barang (paket jual).
- Input penjualan harian yang cepat.
- Ringkasan stok dan penjualan harian yang mudah dibaca.
- Mudah dikembangkan dan dirawat (arsitektur rapi, bukan kode asal tempel).

**Non-tujuan (untuk versi awal)**

- Bukan sistem akuntansi lengkap.
- Belum ada integrasi pembayaran digital atau printer struk.
- Belum multi-cabang toko.
- Belum mode offline penuh.

## 4. Pengguna

- **Pemilik toko (admin):** mengelola barang, paket jual, melihat laporan, melakukan koreksi stok.
- **Kasir/penjaga toko (opsional, fase berikutnya):** hanya input penjualan dan melihat stok.

## 5. Konsep Inti: Satuan Dasar dan Paket Jual

Stok **selalu** disimpan dalam satuan terkecil (satuan dasar), misalnya `pcs`. Cara menjual dimodelkan sebagai **paket jual** (`sale_options`) yang menyatakan harga dan isi dalam satuan dasar.

Contoh barang "Gelas":

- Satuan dasar: pcs
- Paket "Per pcs": harga Rp1.000, isi 1
- Paket "Paket 5.000": harga Rp5.000, isi 6

Penjualan 1 Paket 5.000 mengurangi stok 6. Penjualan 3 Per pcs mengurangi stok 3. Hanya ada satu angka stok, jadi tidak ada konflik antar cara jual.

**Prinsip desain:**

1. Stok = hasil penjumlahan buku stok (ledger), bukan angka yang ditimpa. Semua perubahan tercatat dan bisa ditelusuri.
2. Harga dan isi paket di-*snapshot* ke item transaksi, jadi laporan lama tidak berubah saat harga diubah.
3. Barang dan paket jual dinonaktifkan (`is_active = false`), bukan dihapus, agar riwayat tetap utuh.

## 6. Fitur

### 6.1 MVP (versi 1)

**A. Manajemen Barang**

- Tambah, ubah, nonaktifkan barang (nama, kategori, satuan dasar, stok minimum).
- Kelola paket jual per barang (label, harga, isi dalam satuan dasar).

**B. Menu Harian**

- Setiap hari pemilik memilih barang mana yang aktif dijual/dipantau hari itu.
- Bisa menyalin menu dari hari sebelumnya.

**C. Input Penjualan (Kasir)**

- Pilih barang dari menu harian, pilih paket jual, isi jumlah paket.
- Bisa beberapa barang dalam satu transaksi (keranjang).
- Total harga dihitung otomatis. Stok berkurang otomatis setelah transaksi disimpan.

**D. Stok**

- Daftar stok saat ini, dengan penanda barang hampir habis (stok <= stok minimum).
- Catat barang masuk (restock).
- Koreksi stok (stok opname) sebagai pergerakan tipe `adjust`.
- Riwayat pergerakan stok per barang.

**E. Ringkasan Harian**

- Total pendapatan hari itu.
- Jumlah terjual per barang (dalam satuan dasar) dan pendapatannya.
- Daftar barang stok rendah.

**F. Autentikasi**

- Login email + password lewat Supabase Auth. Semua data hanya bisa diakses user yang login.

### 6.2 Fase Berikutnya (backlog)

- Peran pengguna (admin vs kasir).
- Laporan mingguan/bulanan dengan grafik, ekspor CSV/Excel.
- Pembatalan/retur transaksi (menghasilkan pergerakan stok pembalik).
- Harga modal dan laporan laba.
- Pencarian dan filter barang yang lebih lengkap, scan barcode.
- Notifikasi stok rendah.
- PWA agar bisa dipasang di HP dan tetap bisa dibuka saat koneksi buruk.
- Multi-satuan (misalnya dus berisi 12 pcs) untuk restock.

## 7. Tech Stack

**Bahasa:** TypeScript (frontend), SQL/PLpgSQL (database)

**Frontend**

- React 18 + Vite (SPA)
- TypeScript (mode strict)
- React Router (routing)
- TanStack Query (pengambilan dan cache data server)
- Tailwind CSS + shadcn/ui (komponen UI)
- React Hook Form + Zod (form dan validasi)
- date-fns (tanggal; zona waktu Asia/Makassar)
- Recharts (grafik, fase berikutnya)
- lucide-react (ikon)
- Zustand (state keranjang kasir yang hanya hidup di sisi klien)

**Backend / Data**

- Supabase: PostgreSQL, Auth, Row Level Security, RPC (fungsi database)
- `@supabase/supabase-js`

**Kualitas kode**

- ESLint + Prettier
- Vitest + React Testing Library (unit/komponen)
- Supabase CLI untuk migrasi database (file `.sql` berurutan di repo)

**Deploy:** Vercel atau Netlify untuk frontend, Supabase Cloud untuk backend.

## 8. Arsitektur

Arsitektur berlapis dengan pemisahan tanggung jawab yang jelas:

1. **Presentation (UI):** komponen React dan halaman. Tidak boleh memanggil Supabase secara langsung.
2. **Hooks (TanStack Query):** `useProducts`, `useCreateSale`, dan sejenisnya. Menghubungkan UI ke layer data dan mengelola cache serta status loading/error.
3. **Service/API layer:** fungsi murni yang memanggil Supabase (`productsApi.list()`, `salesApi.create()`). Satu-satunya tempat yang mengenal Supabase.
4. **Database:** semua aturan data yang harus konsisten (stok, snapshot harga, validasi) dijaga di Postgres lewat constraint, trigger, dan fungsi RPC, bukan hanya di frontend.

Aliran data contoh (input penjualan):

`SalesPage` -> `useCreateSale()` -> `salesApi.create()` -> RPC `create_sale` -> insert `sales` + `sale_items` -> trigger menulis `stock_movements` -> cache `stock` dan `daily-summary` di-invalidate -> UI ter-update.

**Keputusan penting:**

- Pembuatan transaksi dilakukan lewat **satu fungsi RPC** supaya atomik (semua berhasil atau semua batal), bukan beberapa insert terpisah dari klien.
- Struktur folder berbasis **fitur** (feature-based), bukan berbasis jenis file, agar mudah dikembangkan.
- Tipe TypeScript database digenerate dari Supabase (`supabase gen types typescript`), jadi tipe selalu sesuai skema.
- Semua uang dan jumlah diperlakukan sebagai angka; format Rupiah hanya di layer tampilan.

## 9. Struktur Folder

```
toko-stok/
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init_schema.sql
│   │   ├── 0002_views.sql
│   │   ├── 0003_functions.sql
│   │   └── 0004_rls_policies.sql
│   ├── seed.sql
│   └── config.toml
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── providers/
│   │   │   ├── QueryProvider.tsx
│   │   │   └── AuthProvider.tsx
│   │   └── layouts/
│   │       ├── AppLayout.tsx
│   │       └── AuthLayout.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/authApi.ts
│   │   │   ├── hooks/useAuth.ts
│   │   │   ├── components/LoginForm.tsx
│   │   │   └── pages/LoginPage.tsx
│   │   ├── products/
│   │   │   ├── api/productsApi.ts
│   │   │   ├── hooks/useProducts.ts
│   │   │   ├── components/ProductForm.tsx
│   │   │   ├── components/SaleOptionsEditor.tsx
│   │   │   ├── schemas/productSchema.ts
│   │   │   └── pages/ProductsPage.tsx
│   │   ├── daily-menu/
│   │   │   ├── api/dailyMenuApi.ts
│   │   │   ├── hooks/useDailyMenu.ts
│   │   │   ├── components/MenuPicker.tsx
│   │   │   └── pages/DailyMenuPage.tsx
│   │   ├── sales/
│   │   │   ├── api/salesApi.ts
│   │   │   ├── hooks/useCreateSale.ts
│   │   │   ├── store/cartStore.ts
│   │   │   ├── components/ProductPicker.tsx
│   │   │   ├── components/Cart.tsx
│   │   │   └── pages/SalesPage.tsx
│   │   ├── stock/
│   │   │   ├── api/stockApi.ts
│   │   │   ├── hooks/useStock.ts
│   │   │   ├── components/StockTable.tsx
│   │   │   ├── components/RestockDialog.tsx
│   │   │   ├── components/AdjustDialog.tsx
│   │   │   └── pages/StockPage.tsx
│   │   └── dashboard/
│   │       ├── api/summaryApi.ts
│   │       ├── hooks/useDailySummary.ts
│   │       ├── components/SummaryCards.tsx
│   │       └── pages/DashboardPage.tsx
│   ├── components/
│   │   ├── ui/            # komponen shadcn/ui
│   │   └── shared/        # EmptyState, ConfirmDialog, PageHeader, dll
│   ├── lib/
│   │   ├── supabase.ts    # inisialisasi client (satu-satunya)
│   │   ├── queryClient.ts
│   │   ├── format.ts      # formatRupiah, formatTanggal
│   │   └── utils.ts
│   ├── types/
│   │   └── database.types.ts   # hasil generate Supabase
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

Aturan folder:

- Satu fitur = satu folder yang berisi api, hooks, components, schemas, pages sendiri.
- Fitur tidak boleh meng-import isi dalam fitur lain secara langsung, kecuali lewat file hooks/api yang diekspor.
- Hanya `lib/supabase.ts` yang membuat client Supabase.
- Variabel lingkungan: `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di `.env` (jangan di-commit).

## 10. Skema Database (SQL)

Jalankan berurutan di Supabase SQL Editor (atau jadikan file migrasi).

### 10.1 Tabel, trigger, dan view

```sql
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

-- 3. Buku stok (ledger)
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
```

### 10.2 Tambahan yang disarankan (jalankan setelah 10.1)

**Index** untuk performa query:

```sql
create index idx_sale_options_product on sale_options(product_id);
create index idx_stock_movements_product on stock_movements(product_id, created_at desc);
create index idx_sale_items_sale on sale_items(sale_id);
create index idx_sales_sold_at on sales(sold_at);
create index idx_daily_menu_date on daily_menu(menu_date);
```

**Fungsi RPC `create_sale`** supaya transaksi atomik. Frontend mengirim daftar `{sale_option_id, quantity}`, harga dan isi paket diambil dari database (bukan dipercaya dari klien):

```sql
create or replace function create_sale(p_note text, p_items jsonb)
returns uuid as $$
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
end; $$ language plpgsql;
```

Contoh pemanggilan dari frontend:

```ts
await supabase.rpc('create_sale', {
  p_note: null,
  p_items: [{ sale_option_id: '...', quantity: 2 }],
});
```

**Row Level Security (RLS)**, tahap awal: hanya user yang sudah login yang bisa akses.

```sql
alter table products enable row level security;
alter table sale_options enable row level security;
alter table stock_movements enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table daily_menu enable row level security;

create policy "auth full access" on products
  for all to authenticated using (true) with check (true);
create policy "auth full access" on sale_options
  for all to authenticated using (true) with check (true);
create policy "auth full access" on stock_movements
  for all to authenticated using (true) with check (true);
create policy "auth full access" on sales
  for all to authenticated using (true) with check (true);
create policy "auth full access" on sale_items
  for all to authenticated using (true) with check (true);
create policy "auth full access" on daily_menu
  for all to authenticated using (true) with check (true);

-- View mengikuti RLS milik pemanggil
alter view v_stock set (security_invoker = true);
alter view v_daily_summary set (security_invoker = true);
```

Catatan: trigger `fn_sale_item_to_stock` menulis ke `stock_movements`. Jika nanti kebijakan RLS diperketat per peran, tambahkan `security definer` pada fungsi trigger tersebut.

### 10.3 Penjelasan Desain Skema

- **products** hanya menyimpan identitas barang. Tidak ada kolom stok di sini, supaya stok tidak bisa tidak sinkron.
- **sale\_options** memisahkan cara jual dari barang. Barang baru atau cara jual baru cukup menambah baris.
- **stock\_movements** adalah buku besar stok. Stok = jumlah semua pergerakan. Semua perubahan bisa diaudit.
- **sale\_items** menyimpan `price_snapshot` dan `base_qty_snapshot` supaya riwayat tidak berubah ketika harga atau isi paket diedit.
- **daily\_menu** memenuhi kebutuhan memilih barang aktif per hari; kombinasi tanggal dan barang unik.
- **v\_stock** dan **v\_daily\_summary** menyederhanakan query frontend.

## 11. Alur Pengguna Utama

1. **Awal hari:** pemilik membuka Menu Harian, memilih barang yang dijual (atau menyalin dari kemarin).
2. **Saat jualan:** kasir membuka halaman Penjualan, memilih barang, memilih paket (misalnya "Paket 5.000"), mengisi jumlah, lalu menyimpan. Stok berkurang otomatis.
3. **Restock:** pemilik membuka Stok, memilih barang, mencatat barang masuk.
4. **Akhir hari:** pemilik membuka Dashboard untuk melihat total pendapatan, barang terjual, dan barang hampir habis. Jika stok fisik berbeda, lakukan koreksi stok.

## 12. Halaman dan Rute

- `/login`: masuk
- `/`: dashboard ringkasan harian
- `/penjualan`: input penjualan (kasir)
- `/menu-harian`: pilih menu hari ini
- `/stok`: daftar stok, restock, koreksi, riwayat
- `/barang`: kelola barang dan paket jual

## 13. Kebutuhan Non-Fungsional

- **Responsif:** nyaman dipakai di layar HP (tombol besar, input cepat).
- **Performa:** daftar dan ringkasan tampil di bawah 2 detik pada koneksi biasa.
- **Keamanan:** semua tabel memakai RLS; harga dan isi paket selalu diambil dari database saat transaksi; kunci rahasia tidak pernah masuk kode frontend (hanya anon key).
- **Integritas data:** transaksi atomik; constraint di database; tidak ada penghapusan keras untuk data historis.
- **Zona waktu:** ringkasan harian dihitung dalam Asia/Makassar (WITA).
- **Bahasa:** seluruh label UI dalam Bahasa Indonesia; format uang `Rp5.000`.

## 14. Kriteria Keberhasilan

- Kasir bisa menyimpan satu transaksi dalam kurang dari 15 detik.
- Stok di aplikasi sama dengan hasil penjumlahan semua pergerakan stok, tanpa selisih.
- Menambah barang baru beserta paket jualnya tidak butuh perubahan kode.
- Ringkasan harian cocok dengan total transaksi hari itu.

## 15. Catatan untuk AI/Developer Lain

- Ikuti struktur folder dan aturan layer di bagian 8 dan 9. Jangan memanggil Supabase dari komponen UI.
- Jangan menambah kolom stok di tabel `products`. Stok selalu berasal dari `stock_movements`.
- Jangan membuat transaksi dengan beberapa insert terpisah dari klien; gunakan RPC `create_sale`.
- Gunakan tipe hasil generate Supabase, jangan menulis tipe database manual.
- Gunakan Bahasa Indonesia untuk semua teks yang tampil ke pengguna.
- Daftar barang belum final: jangan hardcode nama barang atau harga di kode.

## 16. Langkah Pengerjaan

1. Buat project Supabase dan jalankan SQL bagian 10.1, lalu 10.2.
2. Buat akun user pertama di Supabase Auth.
3. Inisialisasi project React + Vite + TypeScript, pasang library bagian 7.
4. Generate tipe database dan siapkan `lib/supabase.ts`.
5. Bangun fitur berurutan: auth, products, stock, daily-menu, sales, dashboard.
6. Tes alur utama, lalu deploy.
