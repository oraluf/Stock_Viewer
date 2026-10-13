import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { fetchSeries } from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

function formatLabel(iso, range) {
  const d = new Date(iso);
  if (range === '1D') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function StockChart({ ticker, range }) {
  const [series,   setSeries]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSeries(null);
    setError(false);

    fetchSeries(ticker, range)
      .then(data => {
        if (!cancelled) {
          setSeries(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [ticker, range]);

  if (loading) return <div className="chart-placeholder">Loading {range} chart…</div>;
  if (error) return <div className="chart-placeholder err">Chart unavailable — try again shortly</div>;
  if (!series || series.length === 0)
    return <div className="chart-placeholder">No data for {range}</div>;

  const labels = series.map(p => formatLabel(p.t, range));
  const closes = series.map(p => p.c);
  const isUp   = closes[closes.length - 1] >= closes[0];
  const color  = isUp ? '#22c55e' : '#ef4444';

  const data = {
    labels,
    datasets: [{
      data:            closes,
      borderColor:     color,
      backgroundColor: color + '18',
      borderWidth:     2,
      pointRadius:     0,
      fill:            true,
      tension:         0.15,
    }],
  };

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    animation:           false,
    plugins: {
      legend:  { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 6,
          color:         '#64748b',
          font:          { size: 10 },
        },
        grid: { display: false },
      },
      y: {
        position: 'right',
        ticks: {
          color: '#64748b',
          font:  { size: 10 },
          callback: v => `$${Number(v).toFixed(0)}`,
        },
        grid: { color: '#1e293b' },
      },
    },
  };

  return (
    <div className="chart-wrap">
      <Line data={data} options={options} />
    </div>
  );
}
