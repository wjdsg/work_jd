// Author: mjw
// Date: 2026-04-15

import '../placeholders/styles/placeholders.css'

export default function InsightsPlaceholder() {
  return (
    <div className="placeholder-view">
      <section className="placeholder-hero">
        <h2>洞察驾驶舱</h2>
        <p>观察执行质量、专注趋势与提醒响应速度，持续提升任务掌控力。</p>
      </section>
      <section className="placeholder-grid" aria-label="洞察路线图">
        <article className="placeholder-card">
          <h3>专注评分</h3>
          <p>基于计划与完成对比，生成周维度的专注效率曲线。</p>
        </article>
        <article className="placeholder-card">
          <h3>习惯信号</h3>
          <p>识别高频上下文切换与提醒滞后模式，形成改进建议。</p>
        </article>
      </section>
    </div>
  )
}
