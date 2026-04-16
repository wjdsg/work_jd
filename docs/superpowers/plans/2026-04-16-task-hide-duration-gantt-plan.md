# Task Auto-Hide + Estimated Days + Gantt Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现任务完成后自动隐藏、预计天数计算、甘特图拖拽调整时间

**Architecture:** 扩展数据模型（startDate/estimatedDays），矩阵过滤completed任务，表单新增预计天数输入，日历页新增甘特图组件（CSS grid布局，支持边缘/整体拖拽），IndexedDB迁移v2→v3

**Tech Stack:** React 18, TypeScript 5, Zustand, Vitest, Testing Library, date-fns, CSS Grid

---

## File Structure Overview

- `src/models/task.ts` — Add startDate, estimatedDays fields
- `src/store/taskStore.ts` — Update addTask logic with startDate/dueDate calculation
- `src/features/matrix/MatrixView.tsx` — Add completed task filter
- `src/features/matrix/components/TaskForm.tsx` — Add estimated days input
- `src/features/calendar/CalendarPlaceholder.tsx` — Add Gantt chart section
- `src/features/calendar/components/GanttChart.tsx` — New Gantt chart component
- `src/features/placeholders/styles/placeholders.css` — Add Gantt styles
- `src/storage/indexedDbClient.ts` — Add v2→v3 migration
- Tests for each component

---

### Task 1: Extend Task Data Model

**Files:**
- Modify: `src/models/task.ts`
- Test: `src/store/__tests__/taskStore.test.ts`

- [ ] **Step 1: Write failing test for new fields**

```ts
it('adds startDate and estimatedDays to task model', () => {
  const record = useTaskStore.getState().addTask({
    title: 'New Task with Duration',
    importance: 8,
    urgency: 8,
    estimatedDays: 5,
    tags: [],
  })

  expect(record.startDate).toBeTruthy()
  expect(record.estimatedDays).toBe(5)
  expect(record.dueDate).toBeTruthy()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/store/__tests__/taskStore.test.ts --run`
Expected: FAIL (fields not defined)

- [ ] **Step 3: Add fields to TaskRecord**

```ts
export interface TaskRecord {
  id: string
  title: string
  description?: string
  importance: number
  urgency: number
  quadrant: QuadrantId
  status: TaskStatus
  startDate: string // New field
  estimatedDays: number // New field
  dueDate?: string
  tags: string[]
  reminders: string[]
  stats: {
    completedAt?: string
    snoozeCount: number
  }
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 4: Add fields to TaskDraft**

```ts
export interface TaskDraft {
  title: string
  description?: string
  importance: number
  urgency: number
  estimatedDays?: number // New optional field
  dueDate?: string
  tags?: string[]
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/store/__tests__/taskStore.test.ts --run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/models/task.ts
git commit -m "feat: add startDate and estimatedDays to task model"
```

---

### Task 2: Update TaskStore Add Logic

**Files:**
- Modify: `src/store/taskStore.ts`

- [ ] **Step 1: Write failing test for date calculation**

```ts
it('calculates startDate and dueDate from estimatedDays', () => {
  vi.setSystemTime(new Date('2026-04-16T12:00:00.000Z'))

  const record = useTaskStore.getState().addTask({
    title: 'Duration Task',
    importance: 8,
    urgency: 8,
    estimatedDays: 3,
    tags: [],
  })

  expect(record.startDate).toMatch(/^2026-04-16T00:00:00\.000Z$/)
  expect(record.dueDate).toMatch(/^2026-04-19T00:00:00\.000Z$/)
  expect(record.estimatedDays).toBe(3)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/store/__tests__/taskStore.test.ts --run`
Expected: FAIL (calculation not implemented)

- [ ] **Step 3: Implement addTask calculation logic**

```ts
addTask: (draft) => {
  const now = new Date().toISOString()
  const estimatedDays = draft.estimatedDays ?? 1
  const todayZeroHour = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z')
  const startDate = todayZeroHour.toISOString()
  const dueDate = new Date(todayZeroHour.getTime() + estimatedDays * 24 * 60 * 60 * 1000).toISOString()
  const defaultDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const newRecord: TaskRecord = {
    id: createTaskId(),
    title: draft.title,
    description: draft.description,
    importance: draft.importance,
    urgency: draft.urgency,
    quadrant: computeQuadrant(draft.importance, draft.urgency),
    status: 'todo',
    startDate: startDate,
    estimatedDays: estimatedDays,
    dueDate: draft.dueDate ?? dueDate,
    tags: draft.tags ?? [],
    reminders: [],
    stats: { snoozeCount: 0 },
    createdAt: now,
    updatedAt: now,
  }
  // ... rest of implementation
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/store/__tests__/taskStore.test.ts --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/taskStore.ts src/store/__tests__/taskStore.test.ts
git commit -m "feat: calculate startDate and dueDate from estimatedDays"
```

---

### Task 3: Matrix View Filter Completed Tasks

**Files:**
- Modify: `src/features/matrix/MatrixView.tsx`
- Test: `src/features/matrix/__tests__/matrixView.test.tsx`

- [ ] **Step 1: Write failing test for filter**

```tsx
it('hides completed tasks from matrix view', async () => {
  useTaskStore.getState().addTask({
    title: 'Visible Task',
    importance: 10,
    urgency: 10,
    estimatedDays: 1,
    tags: [],
  })
  useTaskStore.getState().addTask({
    title: 'Hidden Completed Task',
    importance: 8,
    urgency: 8,
    estimatedDays: 1,
    tags: [],
  })
  const completedTask = useTaskStore.getState().tasks.find(t => t.title === 'Hidden Completed Task')
  if (completedTask) {
    useTaskStore.getState().updateTask(completedTask.id, { status: 'completed' })
  }

  render(<MatrixView />)

  expect(await screen.findByText('Visible Task')).toBeInTheDocument()
  expect(screen.queryByText('Hidden Completed Task')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`
Expected: FAIL (completed task still visible)

- [ ] **Step 3: Add filter to MatrixView**

```tsx
export function MatrixView() {
  const allTasks = useTaskStore((state) => state.tasks)
  const tasks = useMemo(() => allTasks.filter(t => t.status !== 'completed'), [allTasks])
  // ... rest uses filtered tasks
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/matrix/MatrixView.tsx src/features/matrix/__tests__/matrixView.test.tsx
git commit -m "feat: filter completed tasks from matrix view"
```

---

### Task 4: Add Estimated Days Input to TaskForm

**Files:**
- Modify: `src/features/matrix/components/TaskForm.tsx`
- Test: `src/features/matrix/__tests__/matrixView.test.tsx`

- [ ] **Step 1: Write failing test for form input**

```tsx
it('shows estimated days input in task form', async () => {
  render(<MatrixView />)

  fireEvent.click(screen.getByRole('button', { name: /新建任务/i }))

  const estimatedDaysInput = screen.getByLabelText(/预计天数/i)
  expect(estimatedDaysInput).toHaveAttribute('type', 'number')
  expect(estimatedDaysInput).toHaveAttribute('min', '1')
  expect(estimatedDaysInput).toHaveAttribute('max', '30')
  expect(estimatedDaysInput).toHaveValue(1)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`
Expected: FAIL (input not found)

- [ ] **Step 3: Add estimated days input to TaskForm**

```tsx
const initialDraft: TaskDraft = {
  title: '',
  importance: 6,
  urgency: 6,
  estimatedDays: 1,
  tags: [],
}

// In form JSX:
<label htmlFor="task-estimatedDays">预计天数</label>
<input
  id="task-estimatedDays"
  name="estimatedDays"
  type="number"
  min={1}
  max={30}
  step={1}
  value={draft.estimatedDays ?? 1}
  onChange={(event) => setDraft((prev) => ({ ...prev, estimatedDays: Number(event.target.value) }))}
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/features/matrix/__tests__/matrixView.test.tsx --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/matrix/components/TaskForm.tsx src/features/matrix/__tests__/matrixView.test.tsx
git commit -m "feat: add estimated days input to task form"
```

---

### Task 5: Create GanttChart Component (Basic)

**Files:**
- Create: `src/features/calendar/components/GanttChart.tsx`
- Create: `src/features/calendar/__tests__/ganttChart.test.tsx`

- [ ] **Step 1: Write failing test for Gantt rendering**

```tsx
describe('GanttChart', () => {
  beforeEach(() => {
    useTaskStore.getState().clear()
  })

  it('renders task bars from startDate to dueDate', async () => {
    useTaskStore.getState().addTask({
      title: 'Gantt Task',
      importance: 10,
      urgency: 10,
      estimatedDays: 3,
      tags: [],
    })

    render(<GanttChart />)

    expect(await screen.findByText('Gantt Task')).toBeInTheDocument()
    expect(screen.getByTestId('gantt-bar-task')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/calendar/__tests__/ganttChart.test.tsx --run`
Expected: FAIL (component not found)

- [ ] **Step 3: Create GanttChart component skeleton**

```tsx
// Author: mjw
// Date: 2026-04-16

import { useMemo } from 'react'
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import { useTaskStore } from '../../store/taskStore'

export function GanttChart() {
  const tasks = useTaskStore((state) => state.tasks)
  const [currentMonth] = useMemo(() => new Date(), [])

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const visibleTasks = useMemo(() => 
    tasks.filter(t => t.startDate && t.dueDate).sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    ), [tasks])

  return (
    <section className="gantt-chart" aria-label="任务甘特图">
      <header className="gantt-header">任务甘特图</header>
      <div className="gantt-grid">
        {/* Date headers */}
        <div className="gantt-dates">
          {days.map(day => (
            <div key={day.toISOString()} className="gantt-date">
              {format(day, 'd')}
            </div>
          ))}
        </div>
        {/* Task bars */}
        <div className="gantt-tasks">
          {visibleTasks.map(task => (
            <div key={task.id} className="gantt-task-row">
              <span className="gantt-task-title">{task.title}</span>
              <div 
                className="gantt-bar"
                data-testid="gantt-bar-task"
                style={{
                  gridColumnStart: /* calculate */,
                  gridColumnEnd: /* calculate */,
                  backgroundColor: /* by quadrant */,
                  opacity: task.status === 'completed' ? 0.5 : 1,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/features/calendar/__tests__/ganttChart.test.tsx --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/calendar/components/GanttChart.tsx src/features/calendar/__tests__/ganttChart.test.tsx
git commit -m "feat: create GanttChart component skeleton"
```

---

### Task 6: Add Gantt Styles

**Files:**
- Modify: `src/features/placeholders/styles/placeholders.css`

- [ ] **Step 1: Add Gantt CSS**

```css
.gantt-chart {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  padding: 12px;
  margin-top: 20px;
}

.gantt-header {
  font-weight: 700;
  margin-bottom: 10px;
}

.gantt-grid {
  display: grid;
  gap: 4px;
}

.gantt-dates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(30px, 1fr));
  gap: 2px;
}

.gantt-date {
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.gantt-tasks {
  margin-top: 8px;
}

.gantt-task-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}

.gantt-task-title {
  font-size: 0.88rem;
}

.gantt-bar {
  height: 24px;
  border-radius: 4px;
  cursor: move;
  position: relative;
}

.gantt-bar-edge-left,
.gantt-bar-edge-right {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: ew-resize;
}

.gantt-bar-edge-left {
  left: 0;
}

.gantt-bar-edge-right {
  right: 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/placeholders/styles/placeholders.css
git commit -m "feat: add Gantt chart styles"
```

---

### Task 7: Integrate GanttChart into Calendar View

**Files:**
- Modify: `src/features/calendar/CalendarPlaceholder.tsx`
- Test: `src/routes/__tests__/routing.test.tsx`

- [ ] **Step 1: Write failing test for Gantt in calendar**

```tsx
it('shows Gantt chart section in calendar view', async () => {
  const router = createMemoryRouter(routesConfig, { initialEntries: ['/calendar'] })
  render(<RouterProvider router={router} />)

  expect(await screen.findByLabelText(/任务甘特图/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/routes/__tests__/routing.test.tsx --run`
Expected: FAIL (Gantt not found)

- [ ] **Step 3: Add GanttChart to CalendarPlaceholder**

```tsx
import { GanttChart } from './components/GanttChart'

// In JSX, after calendar-selected-tasks section:
<GanttChart />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/routes/__tests__/routing.test.tsx --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/calendar/CalendarPlaceholder.tsx src/routes/__tests__/routing.test.tsx
git commit -m "feat: integrate GanttChart into calendar view"
```

---

### Task 8: Implement Gantt Drag Interaction (Left Edge)

**Files:**
- Modify: `src/features/calendar/components/GanttChart.tsx`
- Test: `src/features/calendar/__tests__/ganttChart.test.tsx`

- [ ] **Step 1: Write failing test for left edge drag**

```tsx
it('adjusts startDate when dragging left edge', async () => {
  useTaskStore.getState().addTask({
    title: 'Drag Left Task',
    importance: 10,
    urgency: 10,
    estimatedDays: 5,
    tags: [],
  })
  const task = useTaskStore.getState().tasks[0]

  render(<GanttChart />)

  const leftEdge = screen.getByTestId('gantt-edge-left')
  fireEvent.mouseDown(leftEdge)
  fireEvent.mouseMove(window, { clientX: 50 })
  fireEvent.mouseUp(window)

  const updated = useTaskStore.getState().tasks[0]
  expect(new Date(updated.startDate).getTime()).toBeLessThan(new Date(task.startDate).getTime())
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/calendar/__tests__/ganttChart.test.tsx --run`
Expected: FAIL (drag not implemented)

- [ ] **Step 3: Implement left edge drag**

```tsx
// State for drag
const [dragState, setDragState] = useState<{
  taskId: string
  edge: 'left' | 'right' | 'whole'
  originalStartDate: Date
  originalDueDate: Date
} | null>(null)

// Handlers
const handleMouseDown = (taskId: string, edge: 'left' | 'right' | 'whole', event: React.MouseEvent) => {
  const task = tasks.find(t => t.id === taskId)
  if (!task) return
  setDragState({
    taskId,
    edge,
    originalStartDate: new Date(task.startDate),
    originalDueDate: new Date(task.dueDate),
  })
}

const handleMouseMove = (event: MouseEvent) => {
  if (!dragState) return
  // Calculate new date from mouse position
  // Update based on edge type
}

const handleMouseUp = () => {
  if (!dragState) return
  // Call updateTask
  setDragState(null)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/features/calendar/__tests__/ganttChart.test.tsx --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/calendar/components/GanttChart.tsx src/features/calendar/__tests__/ganttChart.test.tsx
git commit -m "feat: implement Gantt left edge drag"
```

---

### Task 9: Implement Gantt Drag Interaction (Right Edge)

**Files:**
- Modify: `src/features/calendar/components/GanttChart.tsx`
- Test: `src/features/calendar/__tests__/ganttChart.test.tsx`

- [ ] **Step 1: Write failing test for right edge drag**

```tsx
it('adjusts dueDate when dragging right edge', async () => {
  useTaskStore.getState().addTask({
    title: 'Drag Right Task',
    importance: 10,
    urgency: 10,
    estimatedDays: 5,
    tags: [],
  })
  const task = useTaskStore.getState().tasks[0]

  render(<GanttChart />)

  const rightEdge = screen.getByTestId('gantt-edge-right')
  fireEvent.mouseDown(rightEdge)
  fireEvent.mouseMove(window, { clientX: 100 })
  fireEvent.mouseUp(window)

  const updated = useTaskStore.getState().tasks[0]
  expect(new Date(updated.dueDate).getTime()).toBeGreaterThan(new Date(task.dueDate).getTime())
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/calendar/__tests__/ganttChart.test.tsx --run`
Expected: FAIL

- [ ] **Step 3: Implement right edge drag (similar to left edge)**

```tsx
// In handleMouseMove, add right edge logic
if (dragState.edge === 'right') {
  const newDueDate = /* calculate from mouse position */
  if (newDueDate > startDate + 1 day) {
    // Update
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/features/calendar/__tests__/ganttChart.test.tsx --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/calendar/components/GanttChart.tsx src/features/calendar/__tests__/ganttChart.test.tsx
git commit -m "feat: implement Gantt right edge drag"
```

---

### Task 10: Add IndexedDB Migration (v2→v3)

**Files:**
- Modify: `src/storage/indexedDbClient.ts`
- Test: `src/storage/__tests__/indexedDbMigration.test.ts`

- [ ] **Step 1: Write failing test for migration**

```ts
it('migrates existing tasks with startDate and estimatedDays', async () => {
  // Create v2 database with old task
  const v2db = await openDB(DB_NAME, 2, {
    upgrade(db) {
      // ... create stores without startDate/estimatedDays
    },
  })
  await v2db.put('tasks', {
    id: 'task_old',
    title: 'legacy task',
    importance: 10,
    urgency: 10,
    dueDate: '2026-04-20T00:00:00.000Z',
    // no startDate/estimatedDays
  })
  v2db.close()

  const { getDB } = await import('../indexedDbClient')
  const db = await getDB() // triggers v2->v3 upgrade
  const migrated = await db.get('tasks', 'task_old')

  expect(migrated.startDate).toBeTruthy()
  expect(migrated.estimatedDays).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/storage/__tests__/indexedDbMigration.test.ts --run`
Expected: FAIL

- [ ] **Step 3: Implement v2→v3 migration**

```ts
const DB_VERSION = 3

// In upgrade function:
if (oldVersion >= 2 && oldVersion < 3 && transaction) {
  const taskStore = transaction.objectStore('tasks')
  const tasks = await taskStore.getAll()
  
  await Promise.all(tasks.map(async (task) => {
    const startDate = task.startDate ?? task.createdAt
    const dueDate = task.dueDate ?? new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString()
    const estimatedDays = task.estimatedDays ?? Math.ceil((new Date(dueDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000))
    
    await taskStore.put({
      ...task,
      startDate,
      estimatedDays,
      dueDate,
    })
  }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/storage/__tests__/indexedDbMigration.test.ts --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/storage/indexedDbClient.ts src/storage/__tests__/indexedDbMigration.test.ts
git commit -m "feat: add v2 to v3 migration for startDate/estimatedDays"
```

---

### Task 11: Full Regression Testing

**Files:**
- Verify only

- [ ] **Step 1: Run all tests**

Run: `npm run test -- --run`
Expected: All tests pass

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verify all tests pass for task hide duration gantt implementation"
```