type Props = { seed?: string | null; name?: string | null; url?: string | null; size?: number; className?: string };

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PALETTES: [string, string][] = [
  ['#7c3aed', '#4f46e5'], ['#0ea5e9', '#06b6d4'], ['#10b981', '#14b8a6'],
  ['#f59e0b', '#f97316'], ['#ec4899', '#d946ef'], ['#ef4444', '#f43f5e'],
];

/** Deterministic, dependency-free avatar. Shows the image when a url is given,
 *  otherwise renders a stable geometric SVG derived from the seed. Reusable everywhere. */
export function UserAvatar({ seed, name, url, size = 80, className = '' }: Props) {
  const s = (seed || name || '?').toString();
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name || ''} className={`rounded-full object-cover ${className}`} style={{ width: size, height: size }} />;
  }
  const h = hashStr(s);
  const [c1, c2] = PALETTES[h % PALETTES.length];
  const initial = (name || s || '?').trim().charAt(0).toUpperCase();
  const gid = `ua${h}`;
  const cx1 = 18 + (h % 28), cy1 = 18 + ((h >> 2) % 28);
  const cx2 = 58 + ((h >> 3) % 26), cy2 = 54 + ((h >> 4) % 30);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`rounded-full ${className}`} style={{ width: size, height: size }} role="img" aria-label={name || ''}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gid})`} />
      <circle cx={cx1} cy={cy1} r="26" fill="#ffffff" opacity="0.12" />
      <circle cx={cx2} cy={cy2} r="20" fill="#000000" opacity="0.08" />
      <text x="50" y="50" dy="0.36em" textAnchor="middle" fontSize="44" fontWeight="700" fill="#ffffff" fontFamily="system-ui, -apple-system, sans-serif">{initial}</text>
    </svg>
  );
}
