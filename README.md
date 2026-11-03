# Toko Stok - kode src

Isi paket ini: folder `src/` (React + TypeScript + Supabase) dan `.env.example`.

## Cara pasang

1. Di project Vite kamu (template react-ts), hapus file bawaan: `src/App.tsx`, `src/App.css`, `src/assets/`.
2. Salin folder `src/` dari zip ini ke project, timpa yang ada. Jangan timpa `src/index.css` (sudah berisi `@import "tailwindcss";` dari setup).
   Kalau kamu pakai shadcn/ui, file `src/lib/utils.ts` dan `src/components/ui/*` miliknya tidak akan bentrok dengan kode ini.
3. Salin `.env.example` jadi `.env.local`, isi URL dan anon key Supabase.
4. Pastikan library ini sudah terpasang:
   `npm install @supabase/supabase-js @tanstack/react-query react-router-dom zustand react-hook-form zod @hookform/resolvers`
5. Pastikan alias `@` sudah dikonfigurasi (vite.config.ts dan tsconfig.app.json).
6. Jalankan `npm run dev`, lalu login dengan user yang kamu buat di Supabase Auth.

## Syarat database

SQL di PRD (bagian 10.1 dan 10.2) sudah dijalankan, termasuk fungsi `create_sale` dan RLS.

## Urutan coba

Barang -> tambah barang + paket jual -> Stok -> catat barang masuk -> Menu harian -> pilih barang -> Penjualan -> simpan transaksi -> Dashboard.

## Catatan

- Client Supabase belum memakai tipe hasil generate. Kalau mau, jalankan `supabase gen types` lalu
  tambahkan generic `createClient<Database>` di `src/lib/supabase.ts`.
- Tabel dan view dibaca langsung dari komponen lewat layer `api/` + `hooks/` (komponen tidak memanggil Supabase langsung).
