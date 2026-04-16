# Calendar MVP + Completion Check + Daily Log Design

## 1. 背景与目标
- 修复“日历规划不可用”问题：替换占位页为可用月历视图。
- 日历展示范围限定为：仅展示存在 `dueDate` 的任务。
- 在矩阵任务卡片提供“完成打勾”入口，支持快速完成任务。
- 在矩阵详情抽屉支持重要性/紧急性重编辑（`1..10`），并实时重算象限。
- 每次“完成打勾”动作写入本地日志（`localStorage`），用于后续日报汇总。

## 2. 约束与非目标
- 保持现有路由与模块结构，不引入新三方依赖。
- 日历阶段仅做月视图 MVP，不做周视图/拖拽排程。
- 日历页面先做只读展示，不在日历内直接编辑任务。
- 日志先存储为本地结构化数据，不在本次实现导出 UI。

## 3. 方案选择
### 方案对比
1. 月视图 MVP + 矩阵打勾 + 本地日志（推荐）
   - 优点：改动最小、覆盖核心诉求、回归风险低。
   - 缺点：日历能力相对基础。
2. 月/周双视图 + 日历内可编辑 + 日志导出
   - 优点：能力完整。
   - 缺点：改动面大，不符合“最小化修改”。
3. 仅日期分组列表（非网格日历）
   - 优点：实现最快。
   - 缺点：不符合“日历规划”直观体验。

### 决策
- 采用方案 1：月视图 MVP + 矩阵完成打勾 + 本地日志。

## 4. 设计细节
### 4.1 日历 MVP（仅 dueDate）
- 将 `CalendarPlaceholder` 替换为真实组件 `CalendarView`（保留同路由入口）。
- 数据源：`useTaskStore` 中 `tasks`。
- 过滤规则：仅纳入 `task.dueDate` 非空任务。
- 展示逻辑：
  - 月网格按当前月份渲染。
  - 每个日期格展示当天任务数量与最多 2 条标题摘要（超出显示 `+N`）。
  - 日期格任务排序：按 `dueDate` 升序；同一时间按 `createdAt` 升序。
  - 点击日期后在日历下方显示当天任务列表（只读）。
  - `dueDate` 支持格式：ISO 日期时间字符串或 `YYYY-MM-DD`；无效日期直接跳过渲染。

### 4.2 矩阵完成打勾
- 在 `TaskCard` 增加 `完成` 按钮。
- 按钮显示条件：`task.status !== 'completed'`。
- 点击行为：
  1. 调用 `updateTask(task.id, { status: 'completed' })`。
  2. 调用日志服务写入完成记录。
- 若日志写入失败：不阻断任务完成流程，仅记录告警。

### 4.3 矩阵重要性/紧急性重编辑
- 在 `TaskDetailsDrawer` 增加两个滑杆：
  - `importance`: `min=1,max=10,step=1`
  - `urgency`: `min=1,max=10,step=1`
- 改值时调用 `updateTask` 更新分值；象限由现有 store 逻辑自动重算。

### 4.4 完成日志（localStorage）
- 新增 `dailyLogService`：
  - `appendCompletedLog(task: TaskRecord): void`
  - `readDailyLogs(): DailyLogItem[]`
- 存储键：`daily-work-log`
- 记录结构：
  - `date`（`YYYY-MM-DD`）
  - `taskId`
  - `title`
  - `event: 'task_completed'`
  - `at`（ISO 时间）
- 时间语义统一约定：
  - `date`：使用客户端本地时区生成 `YYYY-MM-DD`（用于日报按天聚合）。
  - `at`：使用 `toISOString()` 存储 UTC 时间戳（用于精确审计时间点）。

## 5. 测试策略（TDD）
先写失败测试，再做最小实现：

1. 日历页面测试
   - 路由 `/calendar` 渲染真实日历而非占位文案。
   - 仅 `dueDate` 存在任务会在日历中出现。
   - `dueDate` 非空但无效时，不在日历中渲染。
   - 点击日期可显示当天任务列表。
   - 日期格最多展示 2 条标题摘要，超出显示 `+N`。
   - 同日多任务按 `dueDate` 升序，若相同再按 `createdAt` 升序。

2. 矩阵完成打勾测试
   - 任务卡片存在“完成”按钮（未完成任务）。
   - 点击后任务状态变为 `completed`。
   - 日志服务被调用并写入 `daily-work-log`。
   - 写入日志字段完整：`date/taskId/title/event/at`，且 `event === 'task_completed'`。
   - 日志写入异常时，任务仍能完成，且不会抛出未捕获异常。
   - 点击完成按钮不触发卡片打开详情抽屉（事件不冒泡）。

3. 详情抽屉重编辑测试
   - 抽屉出现 `1..10` 滑杆。
   - 改变重要性/紧急性后任务分值更新。
   - 象限随分值变化正确更新。

4. 回归验证
   - `npm run lint`
   - `npm run test -- --run`
   - `npm run build`

## 6. 风险与缓解
- 风险：`dueDate` 格式不规范导致日期映射偏差。
  - 缓解：统一使用 `new Date(dueDate)` 并在无效日期时跳过渲染。
- 风险：日志无限增长。
  - 缓解：本期先满足日报留痕；后续可补上限裁剪与导出。
- 风险：完成按钮和卡片点击（开抽屉）事件冲突。
  - 缓解：按钮使用独立事件并阻止冒泡。

## 7. 实施影响面
- `src/features/calendar/CalendarPlaceholder.tsx`（替换为可用日历实现）
- `src/features/matrix/components/TaskCard.tsx`（增加完成入口）
- `src/features/matrix/components/TaskDetailsDrawer.tsx`（增加重编辑滑杆）
- `src/features/matrix/__tests__/matrixView.test.tsx`（补充完成与编辑行为测试）
- `src/routes/__tests__/routing.test.tsx`（补充日历路由行为测试）
- `src/features/calendar/*`（新增对应测试与样式，如需要）
- `src/services/*`（新增日志服务）

## 8. 验收标准
- 日历页面可用，且仅展示有 `dueDate` 任务。
- 矩阵卡片可对未完成任务执行“打勾完成”。
- 每次完成动作有本地日志记录，可用于日报聚合。
- 矩阵详情抽屉可重编辑重要性/紧急性（`1..10`），并正确重算象限。
- 全量 lint/test/build 通过。
- 当点击日期时，当天任务列表固定展示在日历下方。
