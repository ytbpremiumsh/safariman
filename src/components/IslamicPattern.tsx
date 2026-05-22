export function IslamicPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <pattern id="islamic-star" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"
            fill="currentColor"
            opacity="0.6"
          />
          <circle cx="10" cy="10" r="1.5" fill="currentColor" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#islamic-star)" />
    </svg>
  );
}

export function GeometricOrnament({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 60" className={className} aria-hidden>
      <g stroke="currentColor" fill="none" strokeWidth="0.8">
        <line x1="0" y1="30" x2="60" y2="30" />
        <line x1="140" y1="30" x2="200" y2="30" />
        <path d="M70 30 L80 20 L90 30 L100 20 L110 30 L120 20 L130 30 L120 40 L110 30 L100 40 L90 30 L80 40 Z" />
        <circle cx="100" cy="30" r="3" fill="currentColor" />
      </g>
    </svg>
  );
}
