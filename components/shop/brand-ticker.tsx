export function BrandTicker() {
  return (
    <section className="brand-ticker" aria-label="Wear it your way">
      <div aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i}>
            EVERYDAY IS YOUR RUNWAY <span className="ticker-star">✳</span> WEAR
            IT YOUR WAY <span className="ticker-star">✳</span>
          </span>
        ))}
      </div>
    </section>
  );
}
