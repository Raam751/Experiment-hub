import { useState } from 'react';
import { previewAssignment } from '../api';

const COLORS = ['#0d7377', '#16a34a', '#d97706', '#dc2626', '#2563eb', '#2196aa'];

export default function AssignmentTester({ experimentId, variants }) {
  const [userId, setUserId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const handleTest = async (e) => {
    e.preventDefault();
    if (!userId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await previewAssignment(experimentId, userId.trim());
      setResult(res);
      setHistory(prev => [res, ...prev.filter(h => h.userId !== res.userId)].slice(0, 8));
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getVariantColor = (variantId) => {
    const idx = variants.findIndex(v => v.id === variantId);
    return COLORS[idx >= 0 ? idx % COLORS.length : 0];
  };

  return (
    <div className="tester-widget">
      <div className="section-label">Live Assignment Tester</div>
      <p className="tester-desc">
        Type any user ID to see which variant they'd be assigned to. Same ID always returns the same result (deterministic SHA-256 hashing).
      </p>

      <form onSubmit={handleTest} className="tester-form">
        <input className="form-input" value={userId} placeholder="e.g. user_12345, alice@email.com"
          onChange={e => setUserId(e.target.value)} />
        <button className="btn btn-primary btn-sm" type="submit" disabled={loading || !userId.trim()}>
          {loading ? <span className="spinner" /> : 'Test'}
        </button>
      </form>

      {error && <div className="error-msg" style={{ marginTop: 8 }}>{error}</div>}

      {result && (
        <div className="tester-result" style={{ borderLeftColor: getVariantColor(result.variant.id) }}>
          <div className="tester-result-grid">
            <div className="tester-result-item">
              <div className="tester-result-label">User ID</div>
              <div className="tester-result-value mono">{result.userId}</div>
            </div>
            <div className="tester-result-item">
              <div className="tester-result-label">Bucket</div>
              <div className="tester-result-value mono">{result.bucket} / 99</div>
            </div>
            <div className="tester-result-item">
              <div className="tester-result-label">Assigned Variant</div>
              <div className="tester-result-value" style={{ color: getVariantColor(result.variant.id) }}>
                {result.variant.name}
                {result.variant.is_control && <span className="variant-control-tag">CONTROL</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div className="tester-history">
          <div className="tester-history-label">Recent lookups</div>
          {history.slice(1).map((h, i) => (
            <div key={i} className="tester-history-row" onClick={() => { setUserId(h.userId); setResult(h); }}>
              <span className="mono" style={{ color: 'var(--text-muted)' }}>{h.userId}</span>
              <span className="tester-history-dot" style={{ background: getVariantColor(h.variant.id) }} />
              <span>{h.variant.name}</span>
              <span className="mono" style={{ color: 'var(--text-muted)' }}>bucket {h.bucket}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
