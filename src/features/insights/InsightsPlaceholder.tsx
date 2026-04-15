// Author: mjw
// Date: 2026-04-15

import '../placeholders/styles/placeholders.css'

export default function InsightsPlaceholder() {
  return (
    <div className="placeholder-view">
      <section className="placeholder-hero">
        <h2>Insights Cockpit</h2>
        <p>Understand execution quality, focus trend, and reminder responsiveness.</p>
      </section>
      <section className="placeholder-grid" aria-label="Insights roadmap cards">
        <article className="placeholder-card">
          <h3>Focus Score</h3>
          <p>Track weekly focus efficiency based on planned vs completed priorities.</p>
        </article>
        <article className="placeholder-card">
          <h3>Habit Signals</h3>
          <p>Surface recurring context switches and overdue reminder patterns.</p>
        </article>
      </section>
    </div>
  )
}
