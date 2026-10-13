// Lightweight SVG trend line — no chart library needed for a 30-point sparkline
export default function Sparkline({ points, width = 160, height = 44 }) {
  if (!points || points.length < 2) return <div className="sparkline-empty" style={{ height }} />;

  const min   = Math.min(...points);
  const max   = Math.max(...points);
  const span  = max - min || 1;
  const stepX = width / (points.length - 1);
  const pad   = 3;   // keeps the stroke from clipping at the edges

  const coords = points.map((p, i) => [
    i * stepX,
    pad + (height - 2 * pad) * (1 - (p - min) / span),
  ]);

  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;

  const isUp  = points[points.length - 1] >= points[0];
  const color = isUp ? '#22c55e' : '#ef4444';

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={area} fill={color} opacity="0.12" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
