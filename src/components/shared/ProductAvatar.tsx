const TINTS = [
  'bg-emerald-50 text-emerald-700',
  'bg-sky-50 text-sky-700',
  'bg-amber-50 text-amber-700',
  'bg-violet-50 text-violet-700',
  'bg-rose-50 text-rose-700',
  'bg-teal-50 text-teal-700',
]

function hash(text: string): number {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

interface ProductAvatarProps {
  name: string
  size?: 'sm' | 'md'
}

/** Kotak inisial berwarna lembut, warnanya tetap untuk nama yang sama. */
export function ProductAvatar({ name, size = 'md' }: ProductAvatarProps) {
  const tint = TINTS[hash(name) % TINTS.length]
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl font-bold ${tint} ${
        size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'
      }`}
    >
      {name.trim().charAt(0).toUpperCase()}
    </div>
  )
}
