import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExperiment, getVariants, getMetrics, updateExperimentStatus, createVariant, triggerOptimize } from '../api';
import TrafficBar from '../components/TrafficBar';
import MetricsPanel from '../components/MetricsPanel';
import SimulatorPanel from '../components/SimulatorPanel';
import OptimizationResult from '../components/OptimizationResult';
import AssignmentTester from '../components/AssignmentTester';
import { useIsAdmin } from '../contexts/UserContext';

export default function ExperimentPage() {
  const { id: experimentId } = useParams();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [experiment, setExperiment] = useState(null);
  const [variants, setVariants] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState(null);
  const [beforeWeights, setBeforeWeights] = useState([]);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [variantForm, setVariantForm] = useState({ name: '', weight: '', is_control: false });
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    try {
      const [exp, vars] = await Promise.all([
        getExperiment(experimentId),
        getVariants(experimentId)
      ]);
      setExperiment(exp);
      setVariants(vars);
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
    setActionLoading(newStatus);
    setError('');
    try {
      await updateExperimentStatus(experimentId, newStatus);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createVariant(experimentId, variantForm.name, parseInt(variantForm.weight), variantForm.is_control);
      setShowAddVariant(false);
      setVariantForm({ name: '', weight: '', is_control: false });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOptimize = async () => {
    setBeforeWeights([...variants]);
    setOptimizing(true);
    setOptimizeResult(null);
    setError('');
    try {
      const result = await triggerOptimize(experimentId);
      setOptimizeResult(result.data);
      setTimeout(fetchData, 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) return <div className="container"><div className="empty-state"><span className="spinner" /></div></div>;
  if (!experiment) return <div className="container"><div className="error-msg">{error || 'Not found'}</div></div>;

  const statusActions = {
    draft: [{ label: 'Start Experiment', status: 'running', cls: 'btn-success' }],
    running: [
      { label: 'Pause', status: 'paused', cls: 'btn-secondary' },
      { label: 'End', status: 'ended', cls: 'btn-danger' }
    ],
    paused: [
      { label: 'Resume', status: 'running', cls: 'btn-success' },
      { label: 'End', status: 'ended', cls: 'btn-danger' }
    ],
    ended: []
  };

  const isRunning = experiment.status === 'running';
  const hasData = metrics.length > 0;

  return (
    <div className="container">
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 20 }}>
        ← Back to Experiments
      </button>

      {/* ---- Header Card ---- */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{experiment.name}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{experiment.description}</p>
          </div>
          <span className={`badge badge-${experiment.status}`}>{experiment.status}</span>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(statusActions[experiment.status] || []).map(a => (
              <button key={a.status} className={`btn ${a.cls} btn-sm`}
                onClick={() => handleStatusChange(a.status)} disabled={actionLoading !== null}>
                {actionLoading === a.status ? <span className="spinner" /> : a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="error-msg">{error} <span onClick={() => setError('')} style={{ cursor: 'pointer', float: 'right', fontWeight: 600 }}>✕</span></div>}

      {/* ---- Traffic Allocation Bar ---- */}
      {variants.length > 0 && <TrafficBar variants={variants} />}

      {/* ---- Metrics Panel ---- */}
      {['running', 'paused', 'ended'].includes(experiment.status) && (
        <MetricsPanel variants={variants} metrics={metrics} />
      )}

      {/* ---- Simulator (running + admin only) ---- */}
      {isRunning && isAdmin && (
        <SimulatorPanel experimentId={experimentId} variants={variants} onSimulated={fetchData} />
      )}

      {/* ---- Optimization Section (running + admin only) ---- */}
      {isRunning && isAdmin && (
        <div className="section">
          <div className="section-label">Bayesian Optimization</div>
          <div className="card" style={{ padding: 20 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
              Run Thompson Sampling to recalculate optimal traffic allocation based on observed conversion data.
              The algorithm draws 10,000 Monte Carlo samples from each variant's Beta distribution and shifts traffic toward the winner.
            </p>
            <button id="optimize-btn" className="btn btn-primary" onClick={handleOptimize} disabled={optimizing || !hasData}
              style={{ width: '100%', justifyContent: 'center' }}>
              {optimizing
                ? <><span className="spinner" /> Running Thompson Sampling...</>
                : !hasData
                  ? 'Simulate traffic first to generate data'
                  : 'Optimize Traffic Allocation'}
            </button>
          </div>

          {optimizeResult && (
            <OptimizationResult
              beforeWeights={beforeWeights}
              afterWeights={optimizeResult.updated_weights || []}
              variants={variants}
            />
          )}
        </div>
      )}

      {/* ---- Assignment Tester (running only) ---- */}
      {isRunning && <AssignmentTester experimentId={experimentId} variants={variants} />}

      {/* ---- Variants Section ---- */}
      <div className="section">
        <div className="section-title">
          Variants ({variants.length})
          {isAdmin && experiment.status === 'draft' && (
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

        {variants.map(v => (
          <div key={v.id} className="variant-row">
            <div className="variant-name">
              {v.name}
              {v.is_control && <span className="variant-control-tag">CONTROL</span>}
            </div>
            <div className="variant-weight">{v.weight}%</div>
          </div>
        ))}

        {variants.length === 0 && (
          <div className="empty-state" style={{ padding: 30 }}>
            <p>No variants. Add at least 2 variants to run this experiment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
