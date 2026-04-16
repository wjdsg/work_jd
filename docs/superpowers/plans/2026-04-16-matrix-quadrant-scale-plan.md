# Matrix Quadrant Layout & 10-Level Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 调整矩阵象限位置到“左上重要不紧急、右上重要且紧急”，并将评分体系从 1-5 升级为 1-10，完成历史数据 `*2` 迁移与回归验证。

**Architecture:** 在现有 React + Zustand + IndexedDB 架构内做最小改动：先以测试驱动锁定期望行为，再修改模型阈值、矩阵映射、交互评分与数据库版本迁移。迁移逻辑放在 `openDB` upgrade 路径中，确保仅执行一次并保持阈值与象限计算一致。

**Tech Stack:** React 18, TypeScript 5, Zustand, idb, Vitest, Testing Library, Vite.

---

## File Structure Overview

- `src/models/task.ts`：评分范围语义、象限计算默认阈值。
- `src/models/settings.ts`：默认阈值从 4 升级到 6（对应 1-10）。
- `src/storage/indexedDbClient.ts`：DB 版本从 1 升级到 2，新增 v1->v2 迁移。
- `src/storage/storageAdapter.ts`：写入 metadata 时使用新 schemaVersion。
- `src/features/matrix/MatrixView.tsx`：象限展示顺序与中文标题。
- `src/features/matrix/hooks/useMatrixInteractions.ts`：方向键映射与象限对应评分改为 1-10。
- `src/features/matrix/components/TaskForm.tsx`：滑杆范围从 1-5 升级到 1-10，初始值改为 6。
- `src/features/matrix/components/TaskDetailsDrawer.tsx`：详情面板分值展示沿用新 1-10 语义（需回归验证）。
- `src/features/matrix/__tests__/matrixView.test.tsx`：象限位置与交互行为测试。
- `src/store/__tests__/taskStore.test.ts`：新增/更新任务在 1-10 范围下行为验证。
- `src/store/selectors.ts` / `src/store/__tests__/selectors.test.ts`：筛选与排序在 1-10 数据下行为保持正确。
- `src/features/settings/SettingsView.tsx`：阈值滑杆范围由 1-5 升级到 1-10。
- `src/features/settings/__tests__/settingsView.test.tsx`：设置页阈值输入范围与更新行为测试。

## Scope Decision Note

- `src/features/settings/*` 已暴露阈值滑杆（当前 `max=5`），属于本次必改范围。
- 项目未单独存在 `src/storage/migrations.ts`，迁移统一集中在 `src/storage/indexedDbClient.ts` 的 `openDB upgrade` 路径中实现。

---

### Task 1: 锁定象限位置行为（先写失败测试）

**Files:**
- Modify: `src/features/matrix/__tests__/matrixView.test.tsx`
- Modify: `src/features/matrix/MatrixView.tsx`

- [ ] **Step 1: 写失败测试，断言象限位置与文案**

```tsx
it('renders top-left as important-not-urgent and top-right as important-urgent', () => {
  render(<MatrixView />)
  expect(within(screen.getByTestId('quadrant-q2')).getByRole('heading', { level: 3 })).toHaveTextContent('重要不紧急')
  expect(within(screen.getByTestId('quadrant-q1')).getByRole('heading', { level: 3 })).toHaveTextContent('重要且紧急')
})
```

- [ ] **Step 2: 运行单测确认失败**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`

Expected: FAIL（当前顺序仍为 q1, q2, q3, q4，右上不是“重要且紧急”）。

- [ ] **Step 3: 最小实现修改 Matrix 象限顺序与标题**

```tsx
const QUADRANTS = [
  // keep existing Chinese labels unchanged, only reorder quadrant ids to match target coordinates
  { id: 'q2', title: '计划推进（重要不紧急）' },
  { id: 'q1', title: '立即执行（重要且紧急）' },
  { id: 'q4', title: '主动剔除（不重要不紧急）' },
  { id: 'q3', title: '委派处理（不重要但紧急）' },
]
```

- [ ] **Step 4: 重新运行单测确认通过**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`

Expected: PASS。

- [ ] **Step 5: 提交本任务**

```bash
git add src/features/matrix/__tests__/matrixView.test.tsx src/features/matrix/MatrixView.tsx
git commit -m "test: lock matrix quadrant layout semantics"
```

---

### Task 2: 将评分输入升级为 1-10（先写失败测试）

**Files:**
- Modify: `src/features/matrix/__tests__/matrixView.test.tsx`
- Modify: `src/features/matrix/components/TaskForm.tsx`

- [ ] **Step 1: 写失败测试，断言滑杆范围为 1-10**

```tsx
it('uses 1-10 range for importance and urgency sliders', () => {
  render(<MatrixView />)
  fireEvent.click(screen.getByRole('button', { name: /新建任务/i }))
  expect(screen.getByLabelText(/^重要性$/i)).toHaveAttribute('max', '10')
  expect(screen.getByLabelText(/^紧急性$/i)).toHaveAttribute('max', '10')
})
```

- [ ] **Step 2: 运行单测确认失败**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`

Expected: FAIL（当前 max=5）。

- [ ] **Step 3: 最小实现修改 TaskForm**

```tsx
const initialDraft: TaskDraft = { title: '', importance: 6, urgency: 6, tags: [] }
// input range: min=1, max=10, step=1
```

- [ ] **Step 4: 重新运行单测确认通过**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`

Expected: PASS。

- [ ] **Step 5: 提交本任务**

```bash
git add src/features/matrix/__tests__/matrixView.test.tsx src/features/matrix/components/TaskForm.tsx
git commit -m "feat: expand matrix score controls to 1-10"
```

---

### Task 3: 同步 Settings 阈值滑杆到 1-10（先写失败测试）

**Files:**
- Modify: `src/features/settings/__tests__/settingsView.test.tsx`
- Modify: `src/features/settings/SettingsView.tsx`

- [ ] **Step 1: 写失败测试，断言阈值滑杆 max=10**

```tsx
it('uses 1-10 range for threshold sliders in settings', () => {
  render(<SettingsView />)
  expect(screen.getByLabelText(/重要性阈值/i)).toHaveAttribute('max', '10')
  expect(screen.getByLabelText(/紧急性阈值/i)).toHaveAttribute('max', '10')
})
```

- [ ] **Step 2: 运行单测确认失败**

Run: `npm run test -- src/features/settings/__tests__/settingsView.test.tsx --run`

Expected: FAIL（当前设置页阈值范围仍为 1-5）。

- [ ] **Step 3: 最小实现修改 SettingsView 阈值范围**

```tsx
<input id="threshold-importance" type="range" min={1} max={10} ... />
<input id="threshold-urgency" type="range" min={1} max={10} ... />
```

- [ ] **Step 4: 重新运行单测确认通过**

Run: `npm run test -- src/features/settings/__tests__/settingsView.test.tsx --run`

Expected: PASS。

- [ ] **Step 5: 提交本任务**

```bash
git add src/features/settings/__tests__/settingsView.test.tsx src/features/settings/SettingsView.tsx
git commit -m "feat: align settings thresholds with 1-10 scale"
```

---

### Task 4: 调整键盘移动与象限评分映射到 1-10（先写失败测试）

**Files:**
- Modify: `src/features/matrix/__tests__/matrixView.test.tsx`
- Modify: `src/features/matrix/hooks/useMatrixInteractions.ts`

- [ ] **Step 1: 写失败测试，验证方向键后任务进入正确象限并用新评分**

```tsx
it('moves task by keyboard according to new matrix coordinates', async () => {
  useTaskStore.getState().addTask({ title: 'kbd', importance: 10, urgency: 10, tags: [] })
  render(<MatrixView />)
  const taskCard = await screen.findByRole('button', { name: /打开任务 kbd/i })

  const transitions = [
    { key: 'ArrowLeft', expectedQuadrant: 'q2' },
    { key: 'ArrowRight', expectedQuadrant: 'q1' },
    { key: 'ArrowDown', expectedQuadrant: 'q3' },
    { key: 'ArrowUp', expectedQuadrant: 'q1' },
  ] as const

  transitions.forEach(({ key, expectedQuadrant }) => {
    fireEvent.keyDown(taskCard, { key })
    expect(within(screen.getByTestId(`quadrant-${expectedQuadrant}`)).getByText('kbd')).toBeInTheDocument()
  })
})

it('keeps task in same quadrant on boundary move', async () => {
  useTaskStore.getState().addTask({ title: 'edge-kbd', importance: 10, urgency: 1, tags: [] })
  render(<MatrixView />)
  const taskCard = await screen.findByRole('button', { name: /打开任务 edge-kbd/i })
  fireEvent.keyDown(taskCard, { key: 'ArrowUp' })
  expect(within(screen.getByTestId('quadrant-q2')).getByText('edge-kbd')).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行单测确认失败**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`

Expected: FAIL（当前方向映射与目标坐标系不完全对齐）。

- [ ] **Step 3: 最小实现修改键盘映射与象限代表分数**

```ts
const QUADRANT_TO_SCORE = {
  q1: { importance: 10, urgency: 10 },
  q2: { importance: 10, urgency: 1 },
  q3: { importance: 1, urgency: 10 },
  q4: { importance: 1, urgency: 1 },
}
```

- [ ] **Step 4: 重新运行单测确认通过**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`

Expected: PASS。

- [ ] **Step 5: 提交本任务**

```bash
git add src/features/matrix/__tests__/matrixView.test.tsx src/features/matrix/hooks/useMatrixInteractions.ts
git commit -m "fix: align keyboard quadrant transitions with new matrix layout"
```

---

### Task 5: 升级模型默认阈值到 1-10 语义（先写失败测试）

**Files:**
- Modify: `src/store/__tests__/taskStore.test.ts`
- Modify: `src/models/task.ts`
- Modify: `src/models/settings.ts`

- [ ] **Step 1: 写失败测试，验证默认阈值语义与象限判定**

```ts
it('uses 1-10 threshold semantics for default quadrant calculation', () => {
  const task = useTaskStore.getState().addTask({ title: 't', importance: 5, urgency: 5, tags: [] })
  expect(task.quadrant).toBe('q4')
})
```

- [ ] **Step 2: 运行单测确认失败**

Run: `npm run test -- src/store/__tests__/taskStore.test.ts --run`

Expected: FAIL（当前 4/4 默认阈值下，5/5 会被判进高阈值象限，不符合 1-10 语义）。

- [ ] **Step 3: 最小实现修改默认阈值与设置默认值**

```ts
export function computeQuadrant(importance: number, urgency: number, thresholdImportance = 6, thresholdUrgency = 6)
export const DEFAULT_SETTINGS = { quadrantThreshold: { importance: 6, urgency: 6 }, ... }
```

- [ ] **Step 4: 重新运行单测确认通过**

Run: `npm run test -- src/store/__tests__/taskStore.test.ts --run`

Expected: PASS。

- [ ] **Step 5: 提交本任务**

```bash
git add src/store/__tests__/taskStore.test.ts src/models/task.ts src/models/settings.ts
git commit -m "feat: update task thresholds for 1-10 scoring model"
```

---

### Task 6: 增加评分边界校验（先写失败测试）

**Files:**
- Modify: `src/store/__tests__/taskStore.test.ts`
- Modify: `src/models/task.ts`
- Modify: `src/store/taskStore.ts`

- [ ] **Step 1: 写失败测试，验证边界值与越界输入处理**

```ts
it('clamps out-of-range scores into 1-10 when creating task', () => {
  const record = useTaskStore.getState().addTask({ title: 'edge', importance: 11, urgency: 0, tags: [] })
  expect(record.importance).toBe(10)
  expect(record.urgency).toBe(1)
})
```

- [ ] **Step 2: 运行单测确认失败**

Run: `npm run test -- src/store/__tests__/taskStore.test.ts --run`

Expected: FAIL（当前 store 未统一 clamp）。

- [ ] **Step 3: 最小实现新增并应用评分 clamp helper**

```ts
export function clampScore(value: number): number {
  return Math.max(1, Math.min(10, Number.isFinite(value) ? value : 1))
}
```

在 `addTask` / `updateTask` 路径应用 `clampScore`，确保 persisted 值合法。

- [ ] **Step 4: 重新运行单测确认通过**

Run: `npm run test -- src/store/__tests__/taskStore.test.ts --run`

Expected: PASS。

- [ ] **Step 5: 提交本任务**

```bash
git add src/store/__tests__/taskStore.test.ts src/models/task.ts src/store/taskStore.ts
git commit -m "test: enforce 1-10 score boundaries in task store"
```

---

### Task 7: 补齐详情/统计/筛选一致性验证（先写失败测试）

**Files:**
- Modify: `src/features/matrix/__tests__/matrixView.test.tsx`
- Modify: `src/store/__tests__/selectors.test.ts`
- Modify: `src/features/matrix/components/TaskDetailsDrawer.tsx`
- Optional Modify (only if tests fail): `src/store/selectors.ts`
- Optional Modify (only if tests fail): `src/features/matrix/MatrixView.tsx`

- [ ] **Step 1: 写失败测试，验证详情面板展示 1-10 分值**

```tsx
it('shows 1-10 scores in task details drawer', async () => {
  useTaskStore.getState().addTask({ title: 'detail', importance: 10, urgency: 1, tags: [] })
  render(<MatrixView />)
  fireEvent.click(await screen.findByRole('button', { name: /打开任务 detail/i }))
  expect(screen.getByText('10')).toBeInTheDocument()
  expect(screen.getByText('1')).toBeInTheDocument()
})
```

- [ ] **Step 2: 写失败测试，验证矩阵统计计数在新象限语义下正确**

```tsx
it('counts q1 and q2 tasks correctly with 1-10 scores', () => {
  useTaskStore.getState().addTask({ title: 'q1', importance: 10, urgency: 10, tags: [] })
  useTaskStore.getState().addTask({ title: 'q2', importance: 10, urgency: 1, tags: [] })
  render(<MatrixView />)
  expect(within(screen.getByTestId('quadrant-q1')).getAllByRole('button')).toHaveLength(1)
  expect(within(screen.getByTestId('quadrant-q2')).getAllByRole('button')).toHaveLength(1)
})
```

- [ ] **Step 3: 写失败测试，验证编辑面板（TaskDetailsDrawer）滑杆范围为 1-10**

```tsx
it('uses 1-10 sliders in task details edit panel', async () => {
  useTaskStore.getState().addTask({ title: 'edit-me', importance: 10, urgency: 1, tags: [] })
  render(<MatrixView />)

  fireEvent.click(await screen.findByRole('button', { name: /打开任务 edit-me/i }))
  fireEvent.click(screen.getByRole('button', { name: /编辑任务/i }))

  const importanceSlider = screen.getByLabelText(/^重要性$/i)
  const urgencySlider = screen.getByLabelText(/^紧急性$/i)

  expect(importanceSlider).toHaveAttribute('min', '1')
  expect(importanceSlider).toHaveAttribute('max', '10')
  expect(importanceSlider).toHaveAttribute('step', '1')
  expect(urgencySlider).toHaveAttribute('min', '1')
  expect(urgencySlider).toHaveAttribute('max', '10')
  expect(urgencySlider).toHaveAttribute('step', '1')
})
```

- [ ] **Step 4: 写失败测试，验证筛选/排序对 1-10 数据工作正常**

```ts
it('sorts by importance with 1-10 scores', () => {
  const result = applySort(tasks, { field: 'importance', direction: 'desc' })
  expect(result[0].importance).toBe(10)
})
```

- [ ] **Step 5: 运行相关单测确认失败**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx src/store/__tests__/selectors.test.ts --run`

Expected: FAIL（当前未覆盖/未锁定上述行为）。

- [ ] **Step 6: 最小实现补齐必要断言与轻量实现修正（若测试暴露问题）**

仅在测试确实失败时，允许在以下范围做最小修正：
- `src/store/selectors.ts`：仅修正 `applySort`/`applyFilters` 对 1-10 边界值的比较或筛选逻辑；
- `src/features/matrix/MatrixView.tsx`：仅修正统计卡片取值与象限数据映射；
- `src/features/matrix/components/TaskDetailsDrawer.tsx`：仅补充/修正重要性与紧急性编辑滑杆（`min=1,max=10,step=1`）与数值绑定。

禁止在该步骤引入新功能或跨模块重构。

- [ ] **Step 7: 重新运行相关单测确认通过**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx src/store/__tests__/selectors.test.ts --run`

Expected: PASS。

- [ ] **Step 8: 提交本任务**

```bash
git add src/features/matrix/__tests__/matrixView.test.tsx src/store/__tests__/selectors.test.ts src/features/matrix/components/TaskDetailsDrawer.tsx
# add only if modified
git add src/store/selectors.ts src/features/matrix/MatrixView.tsx
git commit -m "test: cover details stats and selectors under 1-10 scale"
```

---

### Task 8: 实现 IndexedDB v1->v2 迁移（先写失败测试）

**Files:**
- Create: `src/storage/__tests__/indexedDbMigration.test.ts`
- Modify: `src/storage/indexedDbClient.ts`
- Modify: `src/storage/storageAdapter.ts`

- [ ] **Step 1: 写失败测试，覆盖历史任务与阈值线性迁移**

```ts
it('migrates v1 data from 1-5 to 1-10 by doubling scores and thresholds', async () => {
  // seed v1 db with task importance=5 urgency=3 quadrant='q2', settings threshold=4
  // reopen with v2 migration
  // expect task importance=10 urgency=6, settings threshold=8
  // expect task quadrant === 'q2' (recomputed with migrated threshold 8/8)
})
```

- [ ] **Step 2: 写失败测试，覆盖迁移幂等性（再次打开 DB 不重复翻倍）**

```ts
it('does not re-apply score migration when reopening v2 database', async () => {
  // first open upgrades v1 -> v2 (score 5->10, threshold 4->8)
  // second open stays at v2
  // expect task importance remains 10 (not 20)
  // expect task urgency remains 6 (not 12)
  // expect threshold remains 8 (not 16)
})
```

- [ ] **Step 3: 运行迁移测试确认失败**

Run: `npm run test -- src/storage/__tests__/indexedDbMigration.test.ts --run`

Expected: FAIL（当前 DB_VERSION=1，无迁移逻辑）。

- [ ] **Step 4: 最小实现 - 升级 DB_VERSION 到 2 并建立升级分支**

```ts
const DB_VERSION = 2
if (oldVersion < 2) {
  // migration body
}
```

- [ ] **Step 5: 最小实现 - 迁移 tasks 分值（*2 + clamp）并重算 quadrant**

```ts
// importance/urgency = clamp(value * 2, 1, 10)
// quadrant = computeQuadrant(migratedImportance, migratedUrgency, migratedThresholdImportance, migratedThresholdUrgency)
```

- [ ] **Step 6: 最小实现 - 迁移 settings 阈值（*2 + clamp）并更新 schemaVersion**

```ts
// metadata.settings.quadrantThreshold.* = clamp(value * 2, 1, 10)
// metadata.schemaVersion = 2
```

- [ ] **Step 7: 保持 storageAdapter metadata 写入版本一致**

```ts
await db.put('metadata', { key: 'singleton', schemaVersion: 2, settings })
```

- [ ] **Step 8: 运行迁移测试确认通过**

Run: `npm run test -- src/storage/__tests__/indexedDbMigration.test.ts --run`

Expected: PASS。

- [ ] **Step 9: 提交本任务**

```bash
git add src/storage/__tests__/indexedDbMigration.test.ts src/storage/indexedDbClient.ts src/storage/storageAdapter.ts
git commit -m "feat: migrate persisted matrix scores from 1-5 to 1-10"
```

---

### Task 9: 全链路回归与发布前验证

**Files:**
- Verify only (no intentional file edits)

- [ ] **Step 1: 运行矩阵相关测试**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx src/features/settings/__tests__/settingsView.test.tsx src/store/__tests__/taskStore.test.ts src/store/__tests__/selectors.test.ts src/storage/__tests__/indexedDbMigration.test.ts --run`

Expected: PASS。

- [ ] **Step 2: 运行全量测试**

Run: `npm run test -- --run`

Expected: PASS。

- [ ] **Step 3: 运行 lint**

Run: `npm run lint`

Expected: PASS。

- [ ] **Step 4: 运行构建**

Run: `npm run build`

Expected: PASS。

- [ ] **Step 5: 手动冒烟验证（本地 dev）**

Run: `npm run dev`

Checklist:
- 新建任务可选 1-10；
- 右上象限为“重要且紧急”；
- 方向键移动后任务进入预期象限；
- 旧数据升级后分值翻倍且不重复翻倍。

- [ ] **Step 6: 提交验证完成记录**

```bash
# only if verification phase introduced code changes:
git status
git add <changed-files-from-verification-phase-only>
git commit -m "chore: verify matrix layout and scale migration"

# if no changes, skip commit
```

---

## Notes

- 严格执行 TDD：每个任务先写失败测试，再写最小实现。
- 避免顺手重构无关模块，保持改动聚焦。
- 若发现现网数据存在异常值（非 1-5），迁移阶段统一 clamp 到 1-10 并在后续 telemetry 中记录（如项目已有相关通道）。
