# Calendar MVP + Completion + Daily Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让日历规划可用（仅展示有 `dueDate` 任务），并在矩阵支持“完成打勾 + 完成日志留痕 + 重要性/紧急性重编辑”。

**Architecture:** 采用最小改动策略：先通过失败测试锁定行为，再分别实现日志服务、矩阵交互增强、日历月视图替换。日志独立为服务模块，矩阵与日历均复用现有 `useTaskStore` 数据，避免新增全局状态。完成日志写入失败不影响主流程，仅告警。

**Tech Stack:** React 18, TypeScript 5, Zustand, Vitest, Testing Library, date-fns.

---

## File Structure Overview

- `src/services/dailyLogService.ts`：完成日志读写（`localStorage`）。
- `src/services/__tests__/dailyLogService.test.ts`：日志结构、时区语义、异常兼容测试。
- `src/features/matrix/components/TaskCard.tsx`：增加“完成”按钮入口与事件隔离。
- `src/features/matrix/components/Quadrant.tsx`：向任务卡片传递完成回调。
- `src/features/matrix/MatrixView.tsx`：接入完成动作，调用 store 更新和日志服务。
- `src/features/matrix/components/TaskDetailsDrawer.tsx`：增加 `importance/urgency` 重编辑滑杆。
- `src/features/matrix/__tests__/matrixView.test.tsx`：新增完成、日志、重编辑行为测试。
- `src/features/calendar/CalendarPlaceholder.tsx`：替换为月视图可用实现（保留导出名以最小改动接线）。
- `src/features/placeholders/styles/placeholders.css`：补充日历网格/日期/当天任务列表样式（最小追加）。
- `src/routes/__tests__/routing.test.tsx`：补充 `/calendar` 路由可用行为测试。

---

### Task 1: 日志服务（localStorage）

**Files:**
- Create: `src/services/dailyLogService.ts`
- Create: `src/services/__tests__/dailyLogService.test.ts`

- [ ] **Step 1: 写失败测试，锁定日志结构与时间语义**

```ts
it('appends completed log with required fields and semantics', () => {
  appendCompletedLog({ id: 't1', title: 'A' } as TaskRecord)
  const logs = readDailyLogs()
  expect(logs[0]).toEqual(
    expect.objectContaining({
      taskId: 't1',
      title: 'A',
      event: 'task_completed',
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      at: expect.stringMatching(/Z$/),
    }),
  )
})
```

- [ ] **Step 2: 运行单测确认失败**

Run: `npm run test -- src/services/__tests__/dailyLogService.test.ts --run`

Expected: FAIL（模块不存在）。

- [ ] **Step 3: 最小实现日志服务**

```ts
const LOG_KEY = 'daily-work-log'
export function appendCompletedLog(task: Pick<TaskRecord, 'id' | 'title'>) { /* push + persist */ }
export function readDailyLogs(): DailyLogItem[] { /* parse with fallback [] */ }
```

- [ ] **Step 4: 运行单测确认通过**

Run: `npm run test -- src/services/__tests__/dailyLogService.test.ts --run`

Expected: PASS。

- [ ] **Step 5: 提交本任务**

```bash
git add src/services/dailyLogService.ts src/services/__tests__/dailyLogService.test.ts
git commit -m "feat: add daily completion log service"
```

---

### Task 2: 矩阵任务卡片支持完成打勾并记录日志

**Files:**
- Modify: `src/features/matrix/__tests__/matrixView.test.tsx`
- Modify: `src/features/matrix/components/TaskCard.tsx`
- Modify: `src/features/matrix/components/Quadrant.tsx`
- Modify: `src/features/matrix/MatrixView.tsx`

- [ ] **Step 1: 写失败测试，验证打勾完成与事件不冒泡**

```tsx
it('completes task by check button and does not open drawer', async () => {
  // seed task, render
  fireEvent.click(screen.getByRole('button', { name: /完成任务 .*?/i }))
  expect(useTaskStore.getState().tasks[0].status).toBe('completed')
  expect(screen.queryByRole('dialog', { name: /任务详情/i })).not.toBeInTheDocument()
})

it('keeps completion flow when log write fails', async () => {
  // mock appendCompletedLog throw error
  // click complete button
  // assert status === completed and no uncaught error
})

it('writes completed log with required fields', async () => {
  // spy localStorage.setItem
  // click complete button
  // assert payload includes date/taskId/title/event/at and event===task_completed
})

it('does not render complete button for completed task', async () => {
  // seed completed task
  // assert no complete button shown
})
```

- [ ] **Step 2: 运行单测确认失败**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`

Expected: FAIL（按钮不存在/行为不满足）。

- [ ] **Step 3: 最小实现完成按钮显示与点击事件隔离**

```tsx
// TaskCard add complete button with stopPropagation
```

- [ ] **Step 4: 最小实现完成状态更新（不含日志）**

```tsx
// MatrixView onComplete -> updateTask(task.id, { status: 'completed' })
```

- [ ] **Step 5: 最小实现日志调用与异常吞吐告警**

```tsx
try {
  appendCompletedLog(task)
} catch (error) {
  console.warn('daily log write failed', error)
}
```

- [ ] **Step 6: 运行单测确认通过**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`

Expected: PASS。

- [ ] **Step 7: 提交本任务**

```bash
git add src/features/matrix/__tests__/matrixView.test.tsx src/features/matrix/components/TaskCard.tsx src/features/matrix/components/Quadrant.tsx src/features/matrix/MatrixView.tsx
git commit -m "feat: support matrix task completion check action"
```

---

### Task 3: 详情抽屉支持重要性/紧急性重编辑

**Files:**
- Modify: `src/features/matrix/__tests__/matrixView.test.tsx`
- Modify: `src/features/matrix/components/TaskDetailsDrawer.tsx`
- Modify: `src/features/matrix/MatrixView.tsx`

- [ ] **Step 1: 写失败测试，验证抽屉滑杆重编辑与象限重算**

```tsx
it('re-edits importance and urgency in drawer and recomputes quadrant', async () => {
  // open drawer
  fireEvent.change(screen.getByLabelText(/^重要性$/i), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText(/^紧急性$/i), { target: { value: '10' } })
  expect(within(screen.getByTestId('quadrant-q3')).getByText('edit-me')).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行单测确认失败**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`

Expected: FAIL（抽屉无滑杆/无更新行为）。

- [ ] **Step 3: 最小实现抽屉滑杆 UI（1..10）**

```tsx
<input type="range" min={1} max={10} step={1} ... />
```

- [ ] **Step 4: 最小实现回调更新与象限重算触发**

```tsx
onChange -> updateTask(task.id, { importance/urgency })
```

- [ ] **Step 5: 运行单测确认通过**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`

Expected: PASS。

- [ ] **Step 6: 提交本任务**

```bash
git add src/features/matrix/__tests__/matrixView.test.tsx src/features/matrix/components/TaskDetailsDrawer.tsx src/features/matrix/MatrixView.tsx
git commit -m "feat: enable matrix score re-edit in task drawer"
```

---

### Task 4: 替换日历占位为月视图 MVP（仅 dueDate）

**Files:**
- Modify: `src/routes/__tests__/routing.test.tsx`
- Modify: `src/features/calendar/CalendarPlaceholder.tsx`
- Modify: `src/features/placeholders/styles/placeholders.css`

- [ ] **Step 1: 写失败测试，验证路由渲染真实日历**

```tsx
it('renders calendar page instead of placeholder copy', async () => {
  // open /calendar
  // assert calendar heading exists, placeholder text missing
})
```

- [ ] **Step 2: 写失败测试，验证 dueDate 过滤与无效日期跳过**

```tsx
it('renders scheduled tasks only on calendar route', async () => {
  // seed one task with dueDate, one without
  // seed one task with invalid dueDate
  // open /calendar
  expect(await screen.findByText('with-due-date')).toBeInTheDocument()
  expect(screen.queryByText('without-due-date')).not.toBeInTheDocument()
  expect(screen.queryByText('invalid-due-date')).not.toBeInTheDocument()
})
```

- [ ] **Step 3: 写失败测试，验证日期点击后在下方展示当天列表**

```tsx
it('shows selected day task list below calendar after date click', async () => {
  // click day cell
  // assert selected-day list section below grid shows expected tasks
})
```

- [ ] **Step 4: 写失败测试，验证日期格 2 条摘要 +N 与排序**

```tsx
it('shows max two summaries with +N and keeps dueDate->createdAt ordering', async () => {
  // seed 3+ tasks on same day with ordered dueDate/createdAt
  // assert only two titles in cell + a +N marker
  // assert selected-day list is ordered by dueDate then createdAt
})
```

- [ ] **Step 5: 运行单测确认失败**

Run: `npm run test -- src/routes/__tests__/routing.test.tsx --run`

Expected: FAIL（当前为占位文案）。

- [ ] **Step 6: 最小实现月视图骨架与路由可用渲染**

```tsx
// calendar heading + month grid shell
```

- [ ] **Step 7: 最小实现 dueDate 过滤与无效日期跳过**

```tsx
// include only tasks with parseable dueDate
```

- [ ] **Step 8: 最小实现日期点击后下方当天列表**

```tsx
// selectedDay state + section rendered below grid
```

- [ ] **Step 9: 最小实现日期格 2 条摘要 +N 与排序**

```tsx
// per-day sort by dueDate then createdAt
// cell summary max 2 titles +N
```

- [ ] **Step 10: 运行单测确认通过**

Run: `npm run test -- src/routes/__tests__/routing.test.tsx --run`

Expected: PASS。

- [ ] **Step 11: 提交本任务**

```bash
git add src/routes/__tests__/routing.test.tsx src/features/calendar/CalendarPlaceholder.tsx src/features/placeholders/styles/placeholders.css
git commit -m "feat: replace calendar placeholder with dueDate-based month view"
```

---

### Task 5: 全链路回归与收尾验证

**Files:**
- Verify only

- [ ] **Step 1: 运行矩阵/日志/路由相关测试**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx src/routes/__tests__/routing.test.tsx src/services/__tests__/dailyLogService.test.ts --run`

Expected: PASS。

- [ ] **Step 2: 运行全量测试**

Run: `npm run test -- --run`

Expected: PASS。

- [ ] **Step 3: 运行静态检查与构建**

Run: `npm run lint && npm run build`

Expected: PASS。

- [ ] **Step 4: 运行类型检查（可选但建议）**

Run: `npm run typecheck`

Expected: PASS。

- [ ] **Step 5: 提交最终验证记录**

```bash
git add src/features/calendar/CalendarPlaceholder.tsx src/features/matrix/components/TaskCard.tsx src/features/matrix/components/TaskDetailsDrawer.tsx src/features/matrix/components/Quadrant.tsx src/features/matrix/MatrixView.tsx src/features/matrix/__tests__/matrixView.test.tsx src/routes/__tests__/routing.test.tsx src/services/dailyLogService.ts src/services/__tests__/dailyLogService.test.ts src/features/placeholders/styles/placeholders.css
git commit -m "chore: verify calendar mvp and completion logging workflow"
```
