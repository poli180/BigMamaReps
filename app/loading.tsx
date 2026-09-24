export default function Loading() {
  return (
    <div className="section" aria-label="Inhalte werden geladen">
      <div
        className="skeleton"
        style={{ height: 60, width: "45%", marginBottom: 40 }}
      />
      <div className="product-grid">
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton" key={i} style={{ height: 420 }} />
        ))}
      </div>
    </div>
  );
}
