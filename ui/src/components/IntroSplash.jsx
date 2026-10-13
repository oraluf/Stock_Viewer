import { useState, useEffect } from 'react';

const DURATION_MS = 3200;   // full intro, including the fade-out
const FADE_MS     = 600;
const SEEN_KEY    = 'introSeen';

const TITLE = 'Welcome to your Stock Dashboard';

// Shown once per browser session; skipped for users who prefer reduced motion
function shouldShow() {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return !sessionStorage.getItem(SEEN_KEY);
  } catch {
    return true;
  }
}

export default function IntroSplash() {
  const [visible, setVisible] = useState(shouldShow);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ }

    const fade = setTimeout(() => setLeaving(true), DURATION_MS - FADE_MS);
    const done = setTimeout(() => setVisible(false), DURATION_MS);
    return () => { clearTimeout(fade); clearTimeout(done); };
  }, [visible]);

  if (!visible) return null;

  function skip() {
    setLeaving(true);
    setTimeout(() => setVisible(false), FADE_MS);
  }

  return (
    <div
      className={`intro ${leaving ? 'intro-leaving' : ''}`}
      onClick={skip}
      role="presentation"
    >
      <svg className="intro-chart" viewBox="0 0 400 120" aria-hidden="true">
        <defs>
          <linearGradient id="intro-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="intro-chart-fill"
          d="M0 100 L40 88 L80 94 L120 70 L160 78 L200 52 L240 60 L280 34 L320 42 L360 18 L400 8 L400 120 L0 120 Z"
          fill="url(#intro-fill)"
        />
        <path
          className="intro-chart-line"
          d="M0 100 L40 88 L80 94 L120 70 L160 78 L200 52 L240 60 L280 34 L320 42 L360 18 L400 8"
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
        />
      </svg>

      <h1 className="intro-title" aria-label={TITLE}>
        {TITLE.split(' ').map((word, i) => (
          <span key={i} className="intro-word" style={{ animationDelay: `${0.9 + i * 0.12}s` }}>
            {word}
          </span>
        ))}
      </h1>
      <p className="intro-subtitle">Live markets · Real data</p>
    </div>
  );
}
