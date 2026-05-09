import { useState } from 'react';
import { simulateTraffic } from '../api';

export default function SimulatorPanel({ experimentId, variants, onSimulated }) {
  const [open, setOpen] = useState(false);
  const [userCount, setUserCount] = useState(200);
  const [rates, setRates] = useState({});
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSimulate = async () => {
    setSimulating(true);
    setError('');
    setResult(null);
    try {
      const conversionRates = {};
      for (const v of variants) {
        conversionRates[v.id] = (rates[v.id] !== undefined ? rates[v.id] : (v.is_control ? 8 : 15)) / 100;
      }
      const res = await simulateTraffic(experimentId, userCount, conversionRates);
      setResult(res.data);
      onSimulated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="simulator-panel">
      <div className="simulator-header" onClick={() => setOpen(!open)}>
        <span className="section-label">Event Simulator</span>
        <span className="simulator-toggle">{open ? 'Hide' : 'Show'}</span>
      </div>

      {open && (
        <div className="simulator-body">
          <p className="simulator-desc">
            Generate simulated user traffic to see metrics and optimization in action.
            Each simulated user gets deterministically assigned to a variant, then fires
            an exposure event and a conversion event based on the configured rate.
          </p>

          <div className="simulator-controls">
            <div className="sim-control">
              <label className="form-label">Users to simulate</label>
              <input className="form-input" type="number" min="10" max="5000" step="10"
                value={userCount} onChange={e => setUserCount(parseInt(e.target.value) || 100)} />
            </div>

            {variants.map(v => (
              <div key={v.id} className="sim-control">
                <label className="form-label">
                  {v.name} conversion rate
                  {v.is_control && <span className="variant-control-tag" style={{ marginLeft: 6 }}>CONTROL</span>}
                </label>
                <div className="sim-rate-row">
                  <input className="sim-slider" type="range" min="0" max="50" step="1"
                    value={rates[v.id] !== undefined ? rates[v.id] : (v.is_control ? 8 : 15)}
                    onChange={e => setRates({ ...rates, [v.id]: parseInt(e.target.value) })} />
                  <span className="sim-rate-value">
                    {rates[v.id] !== undefined ? rates[v.id] : (v.is_control ? 8 : 15)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={handleSimulate} disabled={simulating}
            style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            {simulating ? <><span className="spinner" /> Generating {userCount} users...</> : `Simulate ${userCount} Users`}
          </button>

          {error && <div className="error-msg" style={{ marginTop: 12 }}>{error}</div>}

          {result && (
            <div className="sim-result">
              <div className="sim-result-header">
                <strong>{result.usersSimulated} users simulated</strong>
                <span className="text-muted">{result.eventsGenerated} events generated</span>
              </div>
              <div className="sim-result-grid">
                {Object.entries(result.perVariant).map(([vid, s]) => (
                  <div key={vid} className="sim-result-card">
                    <div className="sim-result-name">{s.name}</div>
                    <div className="sim-result-stats">
                      <span>{s.exposures} exposures</span>
                      <span>{s.conversions} conversions</span>
                      <span className="sim-result-rate">
                        {s.exposures > 0 ? ((s.conversions / s.exposures) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
