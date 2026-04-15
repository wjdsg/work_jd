// Author: mjw
// Date: 2026-04-15

import '../placeholders/styles/placeholders.css'

export default function CalendarPlaceholder() {
  return (
    <div className="placeholder-view">
      <section className="placeholder-hero">
        <h2>Calendar Planning Hub</h2>
        <p>Schedule important work blocks and align reminders with timeline context.</p>
      </section>
      <section className="placeholder-grid" aria-label="Calendar roadmap cards">
        <article className="placeholder-card">
          <h3>Timeline View</h3>
          <p>Week and month timeline with quadrant-aware color lanes.</p>
        </article>
        <article className="placeholder-card">
          <h3>Drag to Schedule</h3>
          <p>Pull tasks from matrix and drop into focused calendar slots.</p>
        </article>
      </section>
    </div>
  )
}
