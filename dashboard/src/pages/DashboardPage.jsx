import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExperiments, getExperimentStats, createExperiment, deleteExperiment } from '../api';
import { useIsAdmin } from '../contexts/UserContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [experiments, setExperiments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchExperiments = async () => {
    try {
      const [data, statsData] = await Promise.all([
        getExperiments(),
        getExperimentStats()
      ]);
      setExperiments(Array.isArray(data) ? data : data.data || []);
      setStats(statsData);
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
    try {
      await deleteExperiment(id);
      setConfirmDelete(null);
      fetchExperiments();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Experiments</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            {experiments.length} experiment{experiments.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {isAdmin && (
          <button id="create-experiment-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Experiment
          </button>
        )}
      </div>

      {/* Platform Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: stats.total_experiments, color: 'var(--accent)' },
            { label: 'Running', value: stats.running, color: 'var(--green)' },
            { label: 'Draft', value: stats.draft, color: 'var(--blue)' },
            { label: 'Paused', value: stats.paused, color: 'var(--yellow)' },
            { label: 'Ended', value: stats.ended, color: 'var(--red)' },
            { label: 'Events', value: (stats.total_events || 0).toLocaleString(), color: 'var(--accent)' },
            { label: 'Users', value: (stats.unique_users || 0).toLocaleString(), color: 'var(--accent)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 18px', cursor: 'default', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-msg">{error} <span onClick={() => setError('')} style={{ cursor: 'pointer', float: 'right', fontWeight: 600 }}>✕</span></div>}

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
            <div key={exp.id} className="card" onClick={() => navigate(`/experiments/${exp.id}`)}
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
                {isAdmin && exp.status === 'draft' && (
                  <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); setConfirmDelete(exp.id); }}>
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

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2 className="modal-title">Delete Experiment?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              This action cannot be undone. The experiment and all its variants will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
