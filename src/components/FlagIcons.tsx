export function FlagID({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <clipPath id="flag-id-clip"><circle cx="16" cy="16" r="15" /></clipPath>
      </defs>
      <g clipPath="url(#flag-id-clip)">
        <rect x="0" y="0" width="32" height="16" fill="#CE1126" />
        <rect x="0" y="16" width="32" height="16" fill="#FFFFFF" />
      </g>
      <circle cx="16" cy="16" r="15" fill="none" stroke="#FFFFFF" strokeWidth="2" />
    </svg>
  );
}

export function FlagGB({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <clipPath id="flag-gb-clip"><circle cx="16" cy="16" r="15" /></clipPath>
      </defs>
      <g clipPath="url(#flag-gb-clip)">
        <rect width="32" height="32" fill="#012169" />
        <path d="M0,0 L32,32 M32,0 L0,32" stroke="#FFFFFF" strokeWidth="5" />
        <path d="M0,0 L32,32 M32,0 L0,32" stroke="#C8102E" strokeWidth="2.5" />
        <path d="M16,0 V32 M0,16 H32" stroke="#FFFFFF" strokeWidth="8" />
        <path d="M16,0 V32 M0,16 H32" stroke="#C8102E" strokeWidth="4" />
      </g>
      <circle cx="16" cy="16" r="15" fill="none" stroke="#FFFFFF" strokeWidth="2" />
    </svg>
  );
}
