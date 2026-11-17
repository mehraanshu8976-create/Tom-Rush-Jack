export function TomRushJackEmblem() {
  return (
    <svg
      viewBox="0 0 420 120"
      className="w-full max-w-[360px] h-auto drop-shadow-[0_6px_14px_rgba(0,0,0,0.65)]"
      role="img"
      aria-label="Tom Rush Jack"
    >
      <defs>
        <linearGradient id="trj-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="trj-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      {/* Dynamic Lightning Crest Wing Behind Text */}
      <path
        d="M28 56 L70 18 L58 50 L96 42 L44 96 L56 64 Z"
        fill="#facc15"
        stroke="#0f172a"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M364 26 L402 18 L382 54 L410 58 L358 98 L372 64 Z"
        fill="#22d3ee"
        stroke="#0f172a"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Shield Backing Ribbon */}
      <polygon
        points="74,20 356,14 342,68 62,74"
        fill="url(#trj-cyan)"
        stroke="#0f172a"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* TOM RUSH */}
      <text
        x="210"
        y="56"
        textAnchor="middle"
        fill="#ffffff"
        stroke="#0f172a"
        strokeWidth="7"
        paintOrder="stroke fill"
        fontWeight="900"
        fontStyle="italic"
        fontSize="36"
        letterSpacing="2"
      >
        TOM RUSH
      </text>

      {/* JACK Banner */}
      <polygon
        points="118,68 308,64 294,108 108,110"
        fill="#e11d48"
        stroke="#0f172a"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <text
        x="208"
        y="99"
        textAnchor="middle"
        fill="url(#trj-gold)"
        stroke="#0f172a"
        strokeWidth="6"
        paintOrder="stroke fill"
        fontWeight="900"
        fontStyle="italic"
        fontSize="32"
        letterSpacing="4"
      >
        JACK
      </text>
    </svg>
  );
}

export function GoldPawCoinIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill="#facc15" stroke="#78350f" strokeWidth="2" />
      <circle cx="12" cy="12" r="8" fill="#fde047" stroke="#d97706" strokeWidth="1" />
      <ellipse cx="12" cy="14.2" rx="3.4" ry="2.7" fill="#b45309" />
      <circle cx="8.2" cy="9.8" r="1.3" fill="#b45309" />
      <circle cx="10.7" cy="8.1" r="1.3" fill="#b45309" />
      <circle cx="13.5" cy="8.1" r="1.3" fill="#b45309" />
      <circle cx="15.8" cy="9.8" r="1.3" fill="#b45309" />
    </svg>
  );
}

export function RaccoonBadgeIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="13" r="8.5" fill="#854d0e" stroke="#0f172a" strokeWidth="1.8" />
      <polygon points="5,9 7.5,3.5 10.5,7.5" fill="#854d0e" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
      <polygon points="19,9 16.5,3.5 13.5,7.5" fill="#854d0e" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="5.5" y="10" width="13" height="5" rx="2.5" fill="#18181b" />
      <circle cx="9.2" cy="12.5" r="1.4" fill="#fef08a" />
      <circle cx="14.8" cy="12.5" r="1.4" fill="#fef08a" />
      <ellipse cx="12" cy="16.3" rx="2.2" ry="1.4" fill="#e2e8f0" />
      <circle cx="12" cy="15.6" r="0.9" fill="#0f172a" />
    </svg>
  );
}

export function HeartSocketIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
      <path
        d="M12 20.4l-1.35-1.23C5.6 14.6 2.5 11.78 2.5 8.3A4.8 4.8 0 0 1 7.3 3.5c1.74 0 3.41.81 4.7 2.13A6.47 6.47 0 0 1 16.7 3.5a4.8 4.8 0 0 1 4.8 4.8c0 3.48-3.1 6.3-8.15 10.87L12 20.4z"
        fill={filled ? '#f43f5e' : '#1e293b'}
        stroke="#0f172a"
        strokeWidth="2"
      />
      {filled && (
        <path
          d="M6.4 7.4a2.4 2.4 0 0 1 2.2-1.7"
          stroke="#fecdd3"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}

export function ShieldPowerIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.5l7.5 3v6c0 4.9-3.2 9.1-7.5 10.5-4.3-1.4-7.5-5.6-7.5-10.5v-6L12 2.5z"
        fill="#2563eb"
        stroke="#ffffff"
        strokeWidth="2"
      />
      <polygon points="12,6.8 13.5,10 17,10.5 14.4,12.9 15.1,16.4 12,14.7 8.9,16.4 9.6,12.9 7,10.5 10.5,10" fill="#facc15" />
    </svg>
  );
}

export function MagnetPowerIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M6 4v7a6 6 0 0 0 12 0V4h-3.5v7a2.5 2.5 0 0 1-5 0V4H6z"
        fill="#ef4444"
        stroke="#0f172a"
        strokeWidth="1.8"
      />
      <rect x="6" y="4" width="3.5" height="3.2" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.2" />
      <rect x="14.5" y="4" width="3.5" height="3.2" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.2" />
    </svg>
  );
}

export function JetPowerIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M13 2L4.5 13.5h6L9 22l10.5-12h-6L13 2z"
        fill="#22d3ee"
        stroke="#0f172a"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PauseButtonIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="5.5" y="4.5" width="4.8" height="15" rx="1.6" fill="#ffffff" stroke="#0c4a6e" strokeWidth="1.5" />
      <rect x="13.7" y="4.5" width="4.8" height="15" rx="1.6" fill="#ffffff" stroke="#0c4a6e" strokeWidth="1.5" />
    </svg>
  );
}

export function SoundButtonIcon({ muted, className = 'w-5 h-5' }: { muted: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M4 9.5h4.2l5.3-4.2v13.4l-5.3-4.2H4V9.5z"
        fill="#ffffff"
        stroke="#0f172a"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {muted ? (
        <path d="M16.5 9l4 6m0-6l-4 6" stroke="#f43f5e" strokeWidth="2.4" strokeLinecap="round" />
      ) : (
        <>
          <path d="M16.5 8.8a4.8 4.8 0 0 1 0 6.4" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M19 6.5a8 8 0 0 1 0 11" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  );
}
