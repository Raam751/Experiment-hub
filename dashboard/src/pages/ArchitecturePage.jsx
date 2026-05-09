const COLORS = {
  accent: '#0d7377', green: '#16a34a', blue: '#2563eb',
  yellow: '#ca8a04', red: '#dc2626', teal: '#2196aa',
};

function DiagramBox({ title, subtitle, color, icon, style }) {
  return (
    <div style={{
      padding: '16px 20px', borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-secondary)', border: `2px solid ${color}`,
      textAlign: 'center', minWidth: 140, ...style
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function Arrow({ label, horizontal, style }) {
  if (horizontal) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 4px', ...style }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2, whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>→</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0', ...style }}>
      <div style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>↓</div>
      {label && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</div>}
    </div>
  );
}

function StateMachine() {
  const states = [
    { name: 'Draft', color: COLORS.blue, desc: 'Configure variants & weights' },
    { name: 'Running', color: COLORS.green, desc: 'Accepting traffic & events' },
    { name: 'Paused', color: COLORS.yellow, desc: 'Temporarily halted' },
    { name: 'Ended', color: COLORS.red, desc: 'Final, read-only results' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', justifyContent: 'center' }}>
      {states.map((s, i) => (
        <div key={s.name} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            padding: '14px 24px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)', border: `2px solid ${s.color}`,
            textAlign: 'center', minWidth: 120
          }}>
            <div style={{ fontWeight: 700, color: s.color, fontSize: '0.95rem' }}>{s.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.desc}</div>
          </div>
          {i < states.length - 1 && (
            <div style={{ padding: '0 8px', color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 700 }}>→</div>
          )}
        </div>
      ))}
      <div style={{ width: '100%', textAlign: 'center', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Running ↔ Paused (bidirectional) &nbsp;|&nbsp; Running/Paused → Ended (one-way)
      </div>
    </div>
  );
}

function AlgorithmStep({ number, title, formula, description }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
      }}>{number}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
        {formula && (
          <code style={{
            display: 'block', background: 'var(--bg-primary)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '8px 12px', fontSize: '0.82rem', fontFamily: "'SF Mono', 'Fira Code', monospace",
            color: COLORS.teal, marginBottom: 6
          }}>{formula}</code>
        )}
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</div>
      </div>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Architecture</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            How ExperimentHub works under the hood
          </p>
        </div>
      </div>

      {/* System Architecture */}
      <div className="section">
        <div className="section-label">System Architecture</div>
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
            {/* Top row: clients */}
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              <DiagramBox icon="🌐" title="Dashboard" subtitle="React + Vite" color={COLORS.accent} />
              <DiagramBox icon="📱" title="Client App" subtitle="SDK / REST" color={COLORS.blue} />
            </div>

            <Arrow label="HTTP / JWT" />

            {/* Middle: API + Bandit */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <DiagramBox icon="⚙️" title="Node.js API" subtitle="Express + JWT + RBAC" color={COLORS.green} style={{ minWidth: 180 }} />
              <Arrow horizontal label="gRPC-style HTTP" />
              <DiagramBox icon="🧠" title="Bandit Service" subtitle="Python + FastAPI" color={COLORS.teal} style={{ minWidth: 180 }} />
            </div>

            <div style={{ display: 'flex', gap: 60, justifyContent: 'center' }}>
              <Arrow label="Read/Write" />
              <Arrow label="Cache" />
            </div>

            {/* Bottom: data stores */}
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              <DiagramBox icon="🗄️" title="PostgreSQL" subtitle="Experiments, Events, Metrics" color={COLORS.yellow} />
              <DiagramBox icon="⚡" title="Redis" subtitle="Config Cache, Sessions" color={COLORS.red} />
            </div>
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <strong>Polyglot microservice design:</strong> The Node.js API handles all CRUD, authentication, and event ingestion.
              The Python Bandit Service is a stateless compute service that runs Thompson Sampling -- it receives metrics via HTTP,
              calculates optimal weights, and pushes results back through an internal callback endpoint. Both services authenticate
              via shared API keys. Redis provides a cache-aside layer for experiment configuration to minimize database reads on
              the hot assignment path.
            </div>
          </div>
        </div>
      </div>

      {/* Thompson Sampling */}
      <div className="section">
        <div className="section-label">Thompson Sampling Algorithm</div>
        <div className="card" style={{ padding: 28 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
            Thompson Sampling is a Bayesian approach to the multi-armed bandit problem. Instead of fixed A/B test splits,
            it dynamically shifts traffic toward better-performing variants while maintaining exploration.
          </p>

          <AlgorithmStep number="1" title="Model each variant as a Beta distribution"
            formula="Beta(α, β) where α = 1 + conversions, β = 1 + exposures - conversions"
            description="The Beta distribution is the conjugate prior for Bernoulli trials. We start with a uniform prior Beta(1,1) and update with observed data." />

          <AlgorithmStep number="2" title="Monte Carlo sampling"
            formula="For each variant, draw 10,000 samples from its Beta(α, β)"
            description="Each sample represents a plausible conversion rate. More data = tighter distribution = more confidence." />

          <AlgorithmStep number="3" title="Count wins"
            formula="winner[i] = argmax(samples[i]) for i in 1..10,000"
            description="For each simulation, the variant with the highest sampled rate 'wins'. Better variants win more often." />

          <AlgorithmStep number="4" title="Convert to traffic weights"
            formula="weight[v] = round(wins[v] / 10,000 × 100)"
            description="Win frequency becomes the new traffic allocation. Largest Remainder Method ensures weights sum to exactly 100." />

          <div style={{ marginTop: 20, padding: 16, background: 'var(--accent-glow)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>Why Thompson Sampling over fixed splits?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Exploration', desc: 'Still gives traffic to uncertain variants' },
                { label: 'Exploitation', desc: 'Naturally favors better performers' },
                { label: 'Adaptive', desc: 'Converges as more data arrives' },
                { label: 'Optimal regret', desc: 'Minimizes opportunity cost over time' },
              ].map(b => (
                <div key={b.label} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{b.label}:</span> {b.desc}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deterministic Assignment */}
      <div className="section">
        <div className="section-label">Deterministic Assignment (Consistent Hashing)</div>
        <div className="card" style={{ padding: 28 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
            Users are assigned to variants deterministically -- the same user always gets the same variant,
            with no database writes. This enables stateless, horizontally-scalable assignment.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
            {[
              { step: 'Input', val: 'experimentId + userId', color: COLORS.blue },
              { step: 'Hash', val: 'SHA-256', color: COLORS.accent },
              { step: 'Truncate', val: 'First 8 hex chars', color: COLORS.teal },
              { step: 'Bucket', val: 'hash % 100 → 0..99', color: COLORS.yellow },
              { step: 'Variant', val: 'Walk weight ranges', color: COLORS.green },
            ].map((s, i) => (
              <div key={s.step} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: `1px solid ${s.color}`, background: 'var(--bg-secondary)', textAlign: 'center', minWidth: 120 }}>
                  <div style={{ fontWeight: 700, color: s.color, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.step}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.val}</div>
                </div>
                {i < 4 && <div style={{ padding: '0 4px', color: 'var(--border)', fontWeight: 700 }}>→</div>}
              </div>
            ))}
          </div>

          <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.85rem' }}>Example with 3 variants (weights: 50, 30, 20)</div>
            <div style={{ display: 'flex', height: 36, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ width: '50%', background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>
                Variant A: Buckets 0-49
              </div>
              <div style={{ width: '30%', background: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>
                B: 50-79
              </div>
              <div style={{ width: '20%', background: COLORS.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>
                C: 80-99
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Stateless', desc: 'No database writes on the hot path' },
              { label: 'Deterministic', desc: 'Same user + experiment = same result, always' },
              { label: 'Cache-friendly', desc: 'Redis cache-aside for experiment config' },
            ].map(b => (
              <div key={b.label} style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--accent)', marginBottom: 4 }}>{b.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Experiment Lifecycle */}
      <div className="section">
        <div className="section-label">Experiment Lifecycle (State Machine)</div>
        <div className="card" style={{ padding: 28 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
            Each experiment follows a strict state machine. Transitions are enforced server-side with validation
            (minimum 2 variants, weights summing to 100).
          </p>
          <StateMachine />
        </div>
      </div>

      {/* Security */}
      <div className="section">
        <div className="section-label">Security & Access Control</div>
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { title: 'JWT Authentication', desc: 'Stateless token-based auth with configurable expiry. Dashboard uses Bearer tokens, runtime uses API keys.' },
              { title: 'Role-Based Access (RBAC)', desc: 'Two roles: Admin (full access) and Viewer (read-only). Enforced at the middleware layer.' },
              { title: 'Timing-Safe Comparison', desc: 'API keys compared with crypto.timingSafeEqual to prevent timing attacks.' },
              { title: 'Password Security', desc: 'bcrypt hashing with salt rounds. Strength validation (8+ chars, letters + numbers).' },
              { title: 'Rate Limiting', desc: 'express-rate-limit on auth endpoints to prevent brute-force attacks.' },
              { title: 'Service-to-Service Auth', desc: 'Internal endpoints between Node and Python use a shared BANDIT_API_KEY.' },
            ].map(s => (
              <div key={s.title} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="section">
        <div className="section-label">Tech Stack</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { name: 'Node.js + Express', role: 'API Server', color: COLORS.green },
            { name: 'Python + FastAPI', role: 'ML/Optimization', color: COLORS.teal },
            { name: 'React + Vite', role: 'Dashboard UI', color: COLORS.accent },
            { name: 'PostgreSQL', role: 'Primary Datastore', color: COLORS.blue },
            { name: 'Redis', role: 'Config Cache', color: COLORS.red },
            { name: 'Docker Compose', role: 'Orchestration', color: COLORS.yellow },
            { name: 'NumPy + SciPy', role: 'Statistical Compute', color: COLORS.teal },
            { name: 'Jest + Pytest', role: 'Testing', color: COLORS.green },
          ].map(t => (
            <div key={t.name} className="card" style={{ padding: '16px 20px', borderLeft: `3px solid ${t.color}` }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
