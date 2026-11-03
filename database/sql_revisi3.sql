-- =====================================================================
-- PATCH: pendaftaran Owner & Kasir lewat kode pendaftaran
-- Aman dijalankan di database yang sudah berisi data (tidak menghapus apa pun).
-- =====================================================================

-- 1. Tabel kode pendaftaran (satu kode per peran)
create table if not exists signup_codes (
  role text primary key check (role in ('owner','kasir')),
  code text not null check (length(code) >= 4)
);

insert into signup_codes (role, code) values
  ('owner', upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))),
  ('kasir', upper(substr(md5(random()::text || clock_timestamp()::text || 'k'), 1, 8)))
on conflict (role) do nothing;

alter table signup_codes enable row level security;
drop policy if exists "codes_owner_all" on signup_codes;
create policy "codes_owner_all" on signup_codes
  for all to authenticated using (is_owner()) with check (is_owner());

-- 2. Cek kode sebelum mendaftar (dipanggil halaman Daftar, hanya mengembalikan benar/salah)
create or replace function check_signup_code(p_role text, p_code text)
returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from profiles)
      or exists (
        select 1 from signup_codes
        where role = p_role and upper(code) = upper(trim(p_code))
      );
$$;

revoke execute on function check_signup_code(text, text) from public;
grant execute on function check_signup_code(text, text) to anon, authenticated;

-- 3. Pembuatan profil otomatis: peran ditentukan dari kode yang dimasukkan.
--    Akun pertama di sistem otomatis jadi owner tanpa kode.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_first boolean := not exists (select 1 from public.profiles);
  v_req_role text := coalesce(new.raw_user_meta_data->>'role', 'kasir');
  v_code text := coalesce(new.raw_user_meta_data->>'signup_code', '');
  v_role text;
begin
  if v_first then
    v_role := 'owner';
  else
    if v_req_role not in ('owner', 'kasir') then
      raise exception 'Peran tidak valid';
    end if;
    if not exists (
      select 1 from public.signup_codes
      where role = v_req_role and upper(code) = upper(trim(v_code))
    ) then
      raise exception 'Kode pendaftaran salah';
    end if;
    v_role := v_req_role;
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    v_role
  );
  return new;
end; $$;