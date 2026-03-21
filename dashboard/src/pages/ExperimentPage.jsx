import { useState, useEffect } from 'react';
import { getExperiment, getVariants, getMetrics, updateExperimentStatus, createVariant, triggerOptimize } from '../api';

export default function ExperimentPage({ experimentId, onBack }) {
  const [experiment, setExperiment] = useState(null);
  const [variants, setVariants] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState(null);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [variantForm, setVariantForm] = useState({ name: '', weight: '', is_control: false });

  const fetchData = async () => {
    try {
      const [exp, vars] = await Promise.all([
        getExperiment(experimentId),
        getVariants(experimentId)
      ]);
      setExperiment(exp);
      setVariants(vars);
      // Only fetch metrics if experiment has been running
      if (['running', 'paused', 'ended'].includes(exp.status)) {
        const m = await getMetrics(experimentId, true);
        setMetrics(m.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [experimentId]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateExperimentStatus(experimentId, newStatus);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    try {
      await createVariant(experimentId, variantForm.name, parseInt(variantForm.weight), variantForm.is_control);
      setShowAddVariant(false);
      setVariantForm({ name: '', weight: '', is_control: false });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    setOptimizeResult(null);
    try {
      const result = await triggerOptimize(experimentId);
      setOptimizeResult(result.data);
      // Refresh variants to show new weights
      setTimeout(fetchData, 500);
    } catch (err) {
      alert(err.message);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) return <div className="container"><div className="empty-state"><span className="spinner" /></div></div>;
  if (!experiment) return <div className="container"><div className="error-msg">{error || 'Not found'}</div></div>;

  const statusActions = {
    draft: [{ label: '▶ Start', status: 'running', cls: 'btn-success' }],
    running: [
      { label: '⏸ Pause', status: 'paused', cls: 'btn-secondary' },
      { label: '⏹ End', status: 'ended', cls: 'btn-danger' }
    ],
    paused: [
      { label: '▶ Resume', status: 'running', cls: 'btn-success' },
      { label: '⏹ End', status: 'ended', cls: 'btn-danger' }
    ],
    ended: []
  };

  return (
    <div className="container">
      <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: 20 }}>← Back</button>

      {/* Header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{experiment.name}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{experiment.description}</p>
          </div>
          <span className={`badge badge-${experiment.status}`}>{experiment.status}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(statusActions[experiment.status] || []).map(a => (
            <button key={a.status} className={`btn ${a.cls} btn-sm`}
              onClick={() => handleStatusChange(a.status)}>{a.label}</button>
          ))}
          {experiment.status === 'running' && (
            <button id="optimize-btn" className="btn btn-primary btn-sm" onClick={handleOptimize} disabled={optimizing}>
              {optimizing ? <><span className="spinner" /> Optimizing...</> : '🧠 Optimize Traffic (Thompson Sampling)'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Optimize Result */}
      {optimizeResult && (
        <div className="optimize-result">
          <strong>🧠 Thompson Sampling Result</strong>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.9rem' }}>
            The Bayesian bandit algorithm analyzed conversion data and recalculated optimal traffic allocation:
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
            {optimizeResult.updated_weights?.map(w => (
              <div key={w.variant_id} className="card" style={{ flex: 1, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{w.new_weight}%</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Variant {w.variant_id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variants Section */}
      <div className="section">
        <div className="section-title">
          Variants ({variants.length})
          {experiment.status === 'draft' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddVariant(!showAddVariant)}>
              + Add Variant
            </button>
          )}
        </div>

        {showAddVariant && (
          <form onSubmit={handleAddVariant} style={{ marginBottom: 16 }}>
            <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label className="form-label">Name</label>
                <input className="form-input" value={variantForm.name} placeholder="e.g. Control (Blue)"
                  onChange={e => setVariantForm({ ...variantForm, name: e.target.value })} required />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Weight (%)</label>
                <input className="form-input" type="number" min="0" max="100" value={variantForm.weight}
                  onChange={e => setVariantForm({ ...variantForm, weight: e.target.value })} required />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={variantForm.is_control}
                  onChange={e => setVariantForm({ ...variantForm, is_control: e.target.checked })} /> Control
              </label>
              <button type="submit" className="btn btn-success btn-sm">Add</button>
            </div>
          </form>
        )}

        {variants.map(v => {
          const metric = metrics.find(m => m.variant_id === v.id);
          return (
            <div key={v.id} className="variant-row">
              <div className="variant-name">
                {v.name}
                {v.is_control && <span className="variant-control-tag">CONTROL</span>}
              </div>
              <div className="variant-weight">{v.weight}%</div>
              <div className="variant-meta">
                {metric ? (
                  <>
                    <div style={{ display: 'flex', gap: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>Exposures: <strong style={{ color: 'var(--text-primary)' }}>{metric.exposures}</strong></span>
                      <span>Conversions: <strong style={{ color: 'var(--text-primary)' }}>{metric.conversions}</strong></span>
                      <span>Rate: <strong style={{ color: parseFloat(metric.conversion_rate) > 0.5 ? 'var(--green)' : 'var(--text-primary)' }}>
                        {(parseFloat(metric.conversion_rate) * 100).toFixed(1)}%
                      </strong></span>
                    </div>
                    <div className="metric-bar-wrap">
                      <div className="metric-bar-bg">
                        <div className={`metric-bar-fill ${parseFloat(metric.conversion_rate) > 0.5 ? 'green' : 'blue'}`}
                          style={{ width: `${Math.min(parseFloat(metric.conversion_rate) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data yet</span>
                )}
              </div>
            </div>
          );
        })}

        {variants.length === 0 && (
          <div className="empty-state" style={{ padding: 30 }}>
            <p>No variants. Add at least 2 variants to run this experiment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
