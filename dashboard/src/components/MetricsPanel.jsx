const COLORS = ['#0d7377', '#16a34a', '#d97706', '#dc2626', '#2563eb', '#2196aa'];

export default function MetricsPanel({ variants, metrics }) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="metrics-empty">
        <div className="section-label">Metrics</div>
        <div className="empty-state" style={{ padding: 30 }}>
          <p>No metrics yet. Use the Event Simulator to generate traffic.</p>
        </div>
      </div>
    );
  }

  const totalExposures = metrics.reduce((s, m) => s + parseInt(m.exposures), 0);
  const totalConversions = metrics.reduce((s, m) => s + parseInt(m.conversions), 0);
  const overallRate = totalExposures > 0 ? (totalConversions / totalExposures) : 0;
  const maxRate = Math.max(...metrics.map(m => parseFloat(m.conversion_rate)), 0.01);

  const controlMetric = metrics.find(m => m.is_control);
  const controlRate = controlMetric ? parseFloat(controlMetric.conversion_rate) : null;

  return (
    <div className="metrics-panel">
      <div className="section-label">Metrics</div>

      <div className="metrics-summary">
        <div className="metrics-summary-item">
          <div className="metrics-summary-value">{totalExposures.toLocaleString()}</div>
          <div className="metrics-summary-label">Total Exposures</div>
        </div>
        <div className="metrics-summary-item">
          <div className="metrics-summary-value">{totalConversions.toLocaleString()}</div>
          <div className="metrics-summary-label">Total Conversions</div>
        </div>
        <div className="metrics-summary-item">
          <div className="metrics-summary-value">{(overallRate * 100).toFixed(1)}%</div>
          <div className="metrics-summary-label">Overall Rate</div>
        </div>
      </div>

      <div className="metrics-variants">
        {metrics.map((m, i) => {
          const rate = parseFloat(m.conversion_rate);
          const barWidth = (rate / maxRate) * 100;
          const variant = variants.find(v => v.id === m.variant_id);
          const lift = controlRate && !m.is_control && controlRate > 0
            ? ((rate - controlRate) / controlRate * 100)
            : null;

          return (
            <div key={m.variant_id} className="metrics-variant-row">
              <div className="metrics-variant-header">
                <div className="metrics-variant-name">
                  {m.variant_name || (variant && variant.name) || `Variant ${m.variant_id}`}
                  {m.is_control && <span className="variant-control-tag">CONTROL</span>}
                </div>
                <div className="metrics-variant-rate">
                  {(rate * 100).toFixed(1)}%
                  {lift !== null && (
                    <span className={`metrics-lift ${lift >= 0 ? 'lift-up' : 'lift-down'}`}>
                      {lift >= 0 ? '+' : ''}{lift.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="metrics-bar-container">
                <div className="metrics-bar-track">
                  <div className="metrics-bar-value"
                    style={{ width: `${barWidth}%`, background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
              <div className="metrics-variant-counts">
                <span>{parseInt(m.exposures).toLocaleString()} exposures</span>
                <span>{parseInt(m.conversions).toLocaleString()} conversions</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
