import { useState, useEffect } from 'react';
import { getExperiments, createExperiment, deleteExperiment } from '../api';

export default function DashboardPage({ onSelectExperiment }) {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchExperiments = async () => {
    try {
      const data = await getExperiments();
      setExperiments(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExperiments(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createExperiment(formName, formDesc);
      setShowModal(false);
      setFormName(''); setFormDesc('');
      fetchExperiments();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this experiment?')) return;
    try {
      await deleteExperiment(id);
      fetchExperiments();
    } catch (err) {
      alert(err.message);
    }
  };

  const statusCounts = experiments.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Experiments</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            {experiments.length} experiment{experiments.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button id="create-experiment-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Experiment
        </button>
      </div>

      {/* Status Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {['draft', 'running', 'paused', 'ended'].map(s => (
          <div key={s} className="card" style={{ padding: '12px 20px', flex: 1, cursor: 'default' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{statusCounts[s] || 0}</div>
            <div className={`badge badge-${s}`} style={{ marginTop: 4 }}>{s}</div>
          </div>
        ))}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : experiments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧪</div>
          <p>No experiments yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {experiments.map(exp => (
            <div key={exp.id} className="card" onClick={() => onSelectExperiment(exp.id)}
              style={{ cursor: 'pointer' }}>
              <div className="card-header">
                <span className="card-title">{exp.name}</span>
                <span className={`badge badge-${exp.status}`}>{exp.status}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
                {exp.description || 'No description'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Created {new Date(exp.created_at).toLocaleDateString()}
                </span>
                {exp.status === 'draft' && (
                  <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(exp.id); }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Experiment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create Experiment</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Experiment Name</label>
                <input id="exp-name" className="form-input" value={formName}
                  onChange={e => setFormName(e.target.value)} placeholder="e.g. Checkout Button Color" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input id="exp-desc" className="form-input" value={formDesc}
                  onChange={e => setFormDesc(e.target.value)} placeholder="e.g. Testing blue vs green CTA" />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="exp-submit" type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <span className="spinner" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
