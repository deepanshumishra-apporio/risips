// iOS-style status bar + home indicator for the device frame.
// Purely cosmetic chrome — adapts to light/dark screen backgrounds.

export function StatusBar({ dark }: { dark?: boolean }) {
  return (
    <div className={`statusbar${dark ? " dark" : ""}`}>
      <span className="time">9:41</span>
      <span className="glyphs">
        {/* cellular */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden>
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0.5" width="3" height="11.5" rx="1" />
        </svg>
        {/* wifi */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden>
          <path d="M8.5 2.2c2.7 0 5.2 1 7 2.8l-1.5 1.6a7.7 7.7 0 0 0-11 0L1.5 5A9.9 9.9 0 0 1 8.5 2.2Z" />
          <path d="M8.5 6.1c1.6 0 3.1.6 4.2 1.7l-1.6 1.6a3.7 3.7 0 0 0-5.2 0L4.3 7.8A6 6 0 0 1 8.5 6.1Z" />
          <circle cx="8.5" cy="10.4" r="1.5" />
        </svg>
        {/* battery */}
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden>
          <rect
            x="0.7"
            y="0.7"
            width="22"
            height="11.6"
            rx="3"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          <rect x="2.3" y="2.3" width="16.5" height="8.4" rx="1.6" fill="currentColor" />
          <path
            d="M24.3 4.2c1 .4 1 3.2 0 3.6V4.2Z"
            fill="currentColor"
            fillOpacity="0.5"
          />
        </svg>
      </span>
    </div>
  );
}

export function HomeIndicator({ dark }: { dark?: boolean }) {
  return <div className={`home-indicator${dark ? " dark" : ""}`} aria-hidden />;
}
