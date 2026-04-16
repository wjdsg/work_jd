// Author: mjw
// Date: 2026-04-15

import '../placeholders/styles/placeholders.css'

export default function CalendarPlaceholder() {
  return (
    <div className="placeholder-view">
      <section className="placeholder-hero">
        <h2>日历规划中枢</h2>
        <p>把关键任务映射到时间轨道，让提醒与日程语境精确对齐。</p>
      </section>
      <section className="placeholder-grid" aria-label="日历规划路线图">
        <article className="placeholder-card">
          <h3>时间轴视图</h3>
          <p>支持周/月双尺度，并以四象限能级进行颜色映射。</p>
        </article>
        <article className="placeholder-card">
          <h3>拖拽排程</h3>
          <p>从矩阵直接拖入时间格，快速构建专注执行窗口。</p>
        </article>
      </section>
    </div>
  )
}
