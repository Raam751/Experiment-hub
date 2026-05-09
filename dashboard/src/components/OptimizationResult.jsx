export default function OptimizationResult({ beforeWeights, afterWeights, variants }) {
  if (!afterWeights || afterWeights.length === 0) return null;

  const getName = (variantId) => {
    const v = variants.find(v => v.id === variantId);
    return v ? v.name : `Variant ${variantId}`;
  };

  const getBefore = (variantId) => {
    const v = beforeWeights.find(v => v.id === variantId);
    return v ? v.weight : 0;
  };

  return (
    <div className="optimize-result">
      <div className="optimize-result-header">
        <strong>Thompson Sampling Result</strong>
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>
          Bayesian bandit recalculated optimal traffic allocation
        </span>
      </div>

      <div className="before-after-grid">
        {afterWeights.map(w => {
          const before = getBefore(w.variant_id);
          const after = w.new_weight;
          const diff = after - before;

          return (
            <div key={w.variant_id} className="before-after-card">
              <div className="before-after-name">{getName(w.variant_id)}</div>
              <div className="before-after-row">
                <div className="before-after-col">
                  <div className="before-after-label">Before</div>
                  <div className="before-after-value">{before}%</div>
                </div>
                <div className="before-after-arrow">
                  {diff > 0 && <span className="arrow-up">+{diff}%</span>}
                  {diff < 0 && <span className="arrow-down">{diff}%</span>}
                  {diff === 0 && <span className="arrow-neutral">--</span>}
                </div>
                <div className="before-after-col">
                  <div className="before-after-label">After</div>
                  <div className="before-after-value highlight">{after}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
