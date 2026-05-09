import { useState } from 'react';
import { getStoredUser } from '../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const COLORS = ['#0d7377', '#16a34a', '#2563eb', '#ca8a04', '#dc2626', '#2196aa'];

function CodeBlock({ language, code, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>}
      <div style={{ position: 'relative', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>{language}</span>
          <button onClick={copy} className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.7rem' }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre style={{ padding: 16, overflow: 'auto', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-primary)', fontFamily: "'SF Mono', 'Fira Code', monospace", margin: 0 }}>
          {code}
        </pre>
      </div>
    </div>
  );
}

function EndpointCard({ method, path, description, body, response, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ padding: '4px 10px', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem', fontFamily: 'monospace', background: method === 'POST' ? 'var(--green-soft)' : 'var(--blue-soft)', color: method === 'POST' ? 'var(--green)' : 'var(--blue)' }}>{method}</span>
        <code style={{ fontSize: '0.9rem', fontWeight: 600 }}>{path}</code>
        <span style={{ flex: 1 }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{description}</span>
        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem' }}>{open ? '−' : '+'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          {body && <CodeBlock language="JSON Body" code={body} />}
          {response && <CodeBlock language="Response" code={response} />}
          {children}
        </div>
      )}
    </div>
  );
}

function TryItPanel() {
  const [experimentId, setExperimentId] = useState('');
  const [userId, setUserId] = useState('user-' + Math.random().toString(36).slice(2, 8));
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tryAssign = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-API-Key'] = apiKey;
      const res = await fetch(`${API_BASE}/experiments/${experimentId}/assign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Request failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Live API Playground</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        Call the assignment endpoint directly. Try different user IDs -- the same user always gets the same variant (deterministic hashing).
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Experiment ID</label>
          <input className="form-input" value={experimentId} onChange={e => setExperimentId(e.target.value)} placeholder="e.g. 1" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">User ID</label>
          <input className="form-input" value={userId} onChange={e => setUserId(e.target.value)} placeholder="e.g. user-abc123" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">API Key (if set)</label>
          <input className="form-input" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="optional" />
        </div>
        <button className="btn btn-primary" onClick={tryAssign} disabled={loading || !experimentId}>
          {loading ? <span className="spinner" /> : 'Send'}
        </button>
      </div>

      {error && <div className="error-msg" style={{ marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <CodeBlock language="Response" code={JSON.stringify(result, null, 2)} />
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <div style={{ flex: 1, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Assigned Variant</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS[0] }}>{result.variant?.name}</div>
            </div>
            <div style={{ flex: 1, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Hash Bucket</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{result.bucket}</div>
            </div>
            <div style={{ flex: 1, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Is Control</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: result.variant?.is_control ? 'var(--green)' : 'var(--text-muted)' }}>{result.variant?.is_control ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntegrationPage() {
  const user = getStoredUser();

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">SDK Integration</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            Connect your application to the experimentation platform
          </p>
        </div>
      </div>

      {/* Authentication */}
      <div className="section">
        <div className="section-label">Authentication</div>
        <div className="card" style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
            Runtime endpoints use API key authentication. Set <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: 4, fontSize: '0.85rem' }}>RUNTIME_API_KEY</code> in your backend's <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: 4, fontSize: '0.85rem' }}>.env</code> file. If no key is set, the endpoints are open (for local development).
          </p>
          <CodeBlock language="HTTP Header" code={`X-API-Key: your-runtime-api-key`} />
        </div>
      </div>

      {/* Endpoints */}
      <div className="section">
        <div className="section-label">API Endpoints</div>

        <EndpointCard
          method="POST" path="/experiments/:id/assign"
          description="Get variant assignment for a user"
          body={`{
  "user_id": "user-12345"
}`}
          response={`{
  "experimentId": 1,
  "experimentName": "Checkout Button Color",
  "userId": "user-12345",
  "variant": {
    "id": 2,
    "name": "Green Button",
    "is_control": false
  },
  "bucket": 73
}`}
        />

        <EndpointCard
          method="POST" path="/events"
          description="Log exposure or conversion events"
          body={`// Single event
{
  "experiment_id": 1,
  "variant_id": 2,
  "user_id": "user-12345",
  "type": "exposure"
}

// Batch events
[
  { "experiment_id": 1, "variant_id": 2, "user_id": "user-12345", "type": "exposure" },
  { "experiment_id": 1, "variant_id": 2, "user_id": "user-12345", "type": "conversion" }
]`}
          response={`{ "id": 42 }`}
        />
      </div>

      {/* SDK Snippets */}
      <div className="section">
        <div className="section-label">SDK Quick Start</div>

        <CodeBlock language="JavaScript (Node.js / Browser)" label="Get variant and log events" code={`const API_URL = '${API_BASE}';
const API_KEY = 'your-runtime-api-key';

async function getVariant(experimentId, userId) {
  const res = await fetch(\`\${API_URL}/experiments/\${experimentId}/assign\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({ user_id: userId })
  });
  return res.json();
}

async function trackEvent(experimentId, variantId, userId, type) {
  await fetch(\`\${API_URL}/events\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      experiment_id: experimentId,
      variant_id: variantId,
      user_id: userId,
      type  // 'exposure' or 'conversion'
    })
  });
}

// Usage
const { variant } = await getVariant(1, 'user-12345');
if (variant.name === 'Green Button') {
  showGreenButton();
}
await trackEvent(1, variant.id, 'user-12345', 'exposure');`} />

        <CodeBlock language="Python (requests)" label="Server-side integration" code={`import requests

API_URL = '${API_BASE}'
API_KEY = 'your-runtime-api-key'
HEADERS = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
}

def get_variant(experiment_id: int, user_id: str) -> dict:
    resp = requests.post(
        f'{API_URL}/experiments/{experiment_id}/assign',
        json={'user_id': user_id},
        headers=HEADERS
    )
    resp.raise_for_status()
    return resp.json()

def track_event(experiment_id: int, variant_id: int,
                user_id: str, event_type: str):
    requests.post(
        f'{API_URL}/events',
        json={
            'experiment_id': experiment_id,
            'variant_id': variant_id,
            'user_id': user_id,
            'type': event_type  # 'exposure' or 'conversion'
        },
        headers=HEADERS
    )

# Usage
result = get_variant(1, 'user-12345')
variant = result['variant']
track_event(1, variant['id'], 'user-12345', 'exposure')`} />

        <CodeBlock language="cURL" label="Command line" code={`# Assign a user to a variant
curl -X POST ${API_BASE}/experiments/1/assign \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-runtime-api-key" \\
  -d '{"user_id": "user-12345"}'

# Log an exposure event
curl -X POST ${API_BASE}/events \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-runtime-api-key" \\
  -d '{"experiment_id": 1, "variant_id": 2, "user_id": "user-12345", "type": "exposure"}'`} />
      </div>

      {/* Live Playground */}
      <div className="section">
        <div className="section-label">Try It Live</div>
        <TryItPanel />
      </div>

      {/* Integration Flow */}
      <div className="section">
        <div className="section-label">Integration Flow</div>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
            {[
              { step: '1', title: 'Request Assignment', desc: 'Your app sends user_id to the assign endpoint' },
              { step: '2', title: 'Deterministic Hash', desc: 'SHA-256 hash maps the user to a bucket (0-99)' },
              { step: '3', title: 'Variant Returned', desc: 'Bucket maps to a variant based on weight ranges' },
              { step: '4', title: 'Show Experience', desc: 'Your app renders the variant-specific UI' },
              { step: '5', title: 'Track Events', desc: 'Log exposures and conversions via the events API' },
            ].map((s, i) => (
              <div key={s.step} style={{ flex: 1, textAlign: 'center', position: 'relative', padding: '0 12px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', margin: '0 auto 12px' }}>{s.step}</div>
                {i < 4 && <div style={{ position: 'absolute', top: 18, left: '60%', right: '-40%', height: 2, background: 'var(--border)' }} />}
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
