const TZ = 'Asia/Makassar'

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value)
}

/** Ubah teks dari input (boleh pakai koma desimal) menjadi angka. */
export function parseNumber(value: string): number {
  return Number(value.trim().replace(',', '.'))
}

/** Tanggal hari ini di WITA, format YYYY-MM-DD. */
export function todayWita(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Rentang waktu satu hari (WITA) untuk filter timestamp. */
export function dayRange(date: string): { start: string; end: string } {
  return {
    start: `${date}T00:00:00+08:00`,
    end: `${addDays(date, 1)}T00:00:00+08:00`,
  }
}

export function formatTanggal(date: string): string {
  return new Date(`${date}T00:00:00+08:00`).toLocaleDateString('id-ID', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTanggalPendek(date: string): string {
  return new Date(`${date}T00:00:00+08:00`).toLocaleDateString('id-ID', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
  })
}

export function formatJam(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Contoh: stok 37 pcs, 1 pak = 12 pcs  ->  "3 pak + 1 pcs". Kosong jika tidak relevan. */
export function formatStockPack(
  stock: number,
  unit: string,
  packUnit: string | null,
  packSize: number | null,
): string {
  if (!packUnit || !packSize || packSize <= 0 || stock < packSize) return ''
  const packs = Math.floor(stock / packSize)
  const rest = Math.round((stock - packs * packSize) * 100) / 100
  return rest > 0
    ? `${formatNumber(packs)} ${packUnit} + ${formatNumber(rest)} ${unit}`
    : `${formatNumber(packs)} ${packUnit}`
}

/** Angka ringkas untuk label grafik: 385000 -> "385rb", 1500000 -> "1,5jt". */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')}jt`
  if (value >= 1_000) return `${Math.round(value / 1_000)}rb`
  return String(Math.round(value))
}

export function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).format(new Date()),
  )
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}
