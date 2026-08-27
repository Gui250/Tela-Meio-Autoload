export function PlayIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function BotIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <circle cx="9" cy="13.5" r="1.3" fill="white" stroke="none" />
      <circle cx="15" cy="13.5" r="1.3" fill="white" stroke="none" />
      <path d="M12 8V4M9 4h6" strokeLinecap="round" />
    </svg>
  );
}

export function PauseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" />
    </svg>
  );
}

export function SkipIcon({ size = 18, back = false }: { size?: number; back?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={back ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M6 5l9 7-9 7zM16.5 5H19v14h-2.5z" />
    </svg>
  );
}

export function SoundIcon({ size = 18, muted = false }: { size?: number; muted?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" fill="currentColor" stroke="none" />
      {muted ? <path d="M16 9.5l4.5 5M20.5 9.5l-4.5 5" /> : <path d="M15.5 9a4.2 4.2 0 010 6M18.5 6.5a7.8 7.8 0 010 11" />}
    </svg>
  );
}
