# Task Auto-Hide + Estimated Days + Gantt Chart Design

## 1. Background and Goals

- **Completed task auto-hide**: When task status is `completed`, it should automatically disappear from the matrix panel (hidden, not deleted).
- **Estimated completion duration**: Add "estimated days" input in task form, automatically calculate `startDate` and `dueDate`.
- **Gantt chart**: Add interactive Gantt chart to calendar page, showing task timeline with drag-to-adjust capabilities for start/end dates.

## 2. Constraints and Non-Goals

- Keep existing route and module structure, no new third-party dependencies.
- Completed tasks are hidden but retained in IndexedDB for statistics/logs/calendar display.
- Gantt chart phase: basic interactive chart (start/end drag), not complex features like dependencies, progress percentage, or resource allocation.
- Estimated days range: 1-30 days (integer).

## 3. Approach Selection

### Approach Comparison

1. **Task auto-hide + estimated days + drag-adjustable Gantt (Recommended)**
   - Pros: Covers all core needs, minimal changes, interactive and intuitive.
   - Cons: Moderate change scope (new fields, new component).

2. **Auto-hide + estimated days + read-only Gantt**
   - Pros: Minimal implementation.
   - Cons: No drag interaction, user cannot adjust schedule in Gantt.

3. **Full Gantt features (dependencies, progress, resources)**
   - Pros: Most complete.
   - Cons: Large changes, complex logic, not aligned with "minimal modification" priority.

### Decision

Adopt approach 1: Task auto-hide + estimated days + drag-adjustable Gantt.

## 4. Design Details

### 4.1 Data Model Extension

- **TaskRecord new fields**
  - `startDate: string` — Task start date (ISO string, e.g., `2026-04-16T00:00:00.000Z`)
  - `estimatedDays: number` — Estimated days (integer, 1-30)

- **TaskDraft new fields**
  - `estimatedDays?: number` — User input (default: 1)
  - Save logic:
    - `startDate = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z')` (zero hour)
    - `dueDate = new Date(startDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000).toISOString()`

- **TaskPatch new fields**
  - `startDate?: string`
  - `dueDate?: string`

- **Default strategy**
  - New task: `startDate` defaults to current day (zero hour: `YYYY-MM-DDT00:00:00.000Z`)
  - `estimatedDays` defaults to 1
  - `dueDate` auto-calculated as `startDate + estimatedDays days`

- **Data migration strategy**
  - Existing tasks without `startDate`: set to `createdAt`
  - Existing tasks without `dueDate`: set to `createdAt + 1 day`
  - Existing tasks without `estimatedDays`: calculate as `(dueDate - startDate) / day`
  - Migration happens in IndexedDB upgrade (v2 -> v3)

### 4.2 Matrix View Filter Logic

- **Filter condition**
  - MatrixView only displays `status !== 'completed'` tasks
  - All four quadrants only render uncompleted tasks

- **Filter timing**
  - Filter immediately after fetching `tasks` from `useTaskStore`
  - Use `tasks.filter(task => task.status !== 'completed')`

- **Completed task retention**
  - Completed tasks retained in IndexedDB (not deleted)
  - Still write completion log (already implemented)
  - Calendar view and Gantt chart always display completed tasks (no toggle, default show)

### 4.3 Task Form Estimated Days Interaction

- **Form new field**
  - `预计天数` — Number input, `min=1, max=30, step=1`
  - Default: 1 day

- **Calculation logic**
  - `startDate` auto-set to current day zero hour (`YYYY-MM-DDT00:00:00.000Z`)
  - `dueDate` auto-calculated: `startDate + estimatedDays days`
  - User does not need to manually fill due date

- **Form layout**
  - Add estimated days after existing fields (title, importance, urgency)
  - Position: below urgency slider, above save button

### 4.4 Gantt Chart Design and Drag Interaction

- **Gantt chart position**
  - Below calendar page (after month view and day task list)
  - New `<section>` area, title: "任务甘特图"

- **Gantt chart time range**
  - Default display current month (consistent with month view)
  - Month navigation: previous/next buttons (same as calendar month view)
  - Horizontal axis: date, vertical axis: task list

- **Task bar rendering**
  - Each task: one horizontal bar from `startDate` to `dueDate`
  - Bar color by quadrant (q1=red, q2=blue, q3=orange, q4=gray)
  - Completed tasks: semi-transparent (opacity 0.5), same color
  - Task bars stacked vertically (no overlap), ordered by `startDate`

- **Drag interaction boundaries**
  - Edge detection: 8px from left/right edge for edge drag
  - Center area (between edges): whole bar drag
  - Cursor change on hover: `ew-resize` on edges, `move` on center

- **Drag interaction**
  - **Left edge drag**: adjust `startDate`
  - **Right edge drag**: adjust `dueDate`
  - **Whole bar drag**: move both `startDate` and `dueDate` (keep days unchanged)
  - After drag, call `updateTask` to update data in real-time

- **Drag boundaries**
  - Left edge cannot be dragged past right edge (minimum 1 day gap)
  - When left edge is dragged: `dueDate` stays fixed, `startDate` cannot go beyond `dueDate - 1 day`
  - When right edge is dragged: `startDate` stays fixed, `dueDate` cannot go before `startDate + 1 day`
  - Minimum date range: 1 day
  - Show real-time date hint during drag

### 4.5 Implementation Details

- **TaskDraft update**
  - Add `estimatedDays?: number` to initial draft
  - In `onSave`, calculate `startDate` and `dueDate`:
    - `const startDateObj = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z')` (zero hour)
    - `startDate = startDateObj.toISOString()`
    - `dueDate = new Date(startDateObj.getTime() + estimatedDays * 24 * 60 * 60 * 1000).toISOString()`

- **MatrixView filter**
  - Add filter in task rendering: `const visibleTasks = tasks.filter(t => t.status !== 'completed')`
  - Pass `visibleTasks` to quadrant components

- **Gantt chart component**
  - Create new `GanttChart.tsx` component
  - Use CSS grid for layout (date columns + task rows)
  - Implement drag handlers using mouse events (desktop only, no touch support)
  - Store draft changes locally and commit on mouse up

- **Estimated days recalculation**
  - When `dueDate` changes via Gantt drag: recalculate `estimatedDays = Math.ceil((dueDate - startDate) / day)`
  - When `startDate` changes via Gantt drag: keep `dueDate` fixed, update `estimatedDays`

- **Drag handlers**
  - `onMouseDown` on left/right edges or whole bar
  - `onMouseMove` calculate new date
  - `onMouseUp` call `updateTask`

## 5. Test Strategy (TDD)

Write failing tests first, then minimal implementation:

1. **Matrix view filter tests**
   - Completed task does not appear in matrix
   - `status !== 'completed'` filter works

2. **Task form estimated days tests**
   - Form shows estimated days input with correct bounds
   - Task saved with calculated `startDate` and `dueDate`
   - Default estimated days is 1

3. **Gantt chart rendering tests**
   - Gantt section appears in calendar page
   - Task bars render from `startDate` to `dueDate`
   - Different quadrant colors

4. **Gantt drag tests**
   - Left edge drag updates `startDate`
   - Right edge drag updates `dueDate`
   - Whole bar drag moves both dates
   - Date hint shows during drag

5. **Edge case tests**
   - `estimatedDays=1` (minimum)
   - `estimatedDays=30` (maximum)
   - Negative/over-range input rejected
   - Old task data compatibility (migration)
   - Drag constraint: minimum 1 day range

6. **Regression verification**
   - `npm run lint`
   - `npm run test -- --run`
   - `npm run build`

## 6. Risks and Mitigation

- Risk: `startDate` or `dueDate` format inconsistent
  - Mitigation: Always use ISO format, parse with `new Date()`
- Risk: Drag performance on many tasks
  - Mitigation: Use CSS transforms, minimal re-renders
- Risk: User adjusts due date in Gantt, estimated days becomes invalid
  - Mitigation: Recalculate `estimatedDays` when `dueDate` changes in Gantt

## 7. Impact Scope

- `src/models/task.ts` — Add new fields
- `src/features/matrix/MatrixView.tsx` — Add filter
- `src/features/matrix/__tests__/matrixView.test.tsx` — Add filter tests
- `src/features/matrix/components/TaskForm.tsx` — Add estimated days input
- `src/features/calendar/CalendarPlaceholder.tsx` — Add Gantt section
- `src/features/calendar/components/GanttChart.tsx` — New component
- `src/features/placeholders/styles/placeholders.css` — Add Gantt styles
- `src/store/taskStore.ts` — Update addTask logic
- `src/store/__tests__/taskStore.test.ts` — Add tests

## 8. Acceptance Criteria

- Completed task auto-hides from matrix panel
- Task form shows estimated days input (1-30, default 1)
- Task saved with auto-calculated `startDate` and `dueDate`
- Gantt chart shows task bars with correct colors and positions
- Gantt chart supports drag to adjust start/end dates
- All lint/test/build pass