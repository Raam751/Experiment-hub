const COLORS = ['#0d7377', '#16a34a', '#d97706', '#dc2626', '#2563eb', '#2196aa'];

export default function TrafficBar({ variants }) {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="traffic-bar-section">
      <div className="section-label">Traffic Allocation</div>
      <div className="traffic-bar">
        {variants.map((v, i) => (
          <div key={v.id} className="traffic-segment"
            style={{ width: `${v.weight}%`, background: COLORS[i % COLORS.length] }}
            title={`${v.name}: ${v.weight}%`}>
            {v.weight >= 10 && <span className="traffic-segment-label">{v.weight}%</span>}
          </div>
        ))}
      </div>
      <div className="traffic-legend">
        {variants.map((v, i) => (
          <div key={v.id} className="traffic-legend-item">
            <span className="traffic-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
            <span>{v.name}</span>
            <span className="text-muted">{v.weight}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
