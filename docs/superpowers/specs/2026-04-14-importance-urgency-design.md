# Author: mjw
# Date: 2026-04-14

# Importance × Urgency Workspace Design

## 1. Architecture Decisions & Quality Goals
| Concern | Decision | Justification | Notes |
| --- | --- | --- | --- |
| UI Shell | Vite + React + TypeScript | HMR 快、产物小、生态成熟；无需 SSR/CSR 切换 | 未来若需 SSR，可迁移到 Next.js，但当前目标为离线 SPA |
| State Management | Zustand + derived selectors + immer middleware | 轻量、hooks 友好；便于将状态切分为 tasks/reminders/settings slices | 通过 `subscribeWithSelector` 减少渲染；暴露 store hydration/patch hooks |
| Persistence | IndexedDB via idb + `storageAdapter` | 支持离线/大数据量；LocalStorage 无事务/容量 | `storageAdapter` 统一 CRUD，后续可替换为云同步 adapter |
| Offline caching | Service Worker (Workbox) 仅缓存静态资源；数据仅存 IndexedDB | 防止缓存陈旧动态数据；静态资源离线可用 | SW 只 precache 构建产物，runtime cache fonts/icons；Phase3 才启用 background sync |
| Multi-tab sync | BroadcastChannel (`importance-urgency-sync`) + storage event fallback | 保持多标签一致；降级时仍可同步 | Settings 显示同步模式；telemetry 记录降级/恢复事件 |
| Conflict resolution | Last-write-wins + monotonic UTC timestamp；taskService 附带 `updatedAt` | 简单可靠；未来云同步可替换 vector clock | Bulk import/replace 遵循 timestamp；若相同则按 source（import 优先） |
| Performance target | Task create/drag/reminder ack p95 < 200ms；Lighthouse PWA ≥ 90 | 明确 SLA，便于监控 | PerformanceObserver 记录 `task.create` 等标记；Lighthouse CI 持续检查 |
| Telemetry | 简单 console instrumentation + 可选 event logger | 收集 IndexedDB 失败、提醒调度异常、Broadcast 降级等事件 | 若接入真实遥测，可复用事件管道 |
| Feature flags | Settings 中存储 `betaFeatures`，允许开启未来功能（云同步、协作） | 便于逐步发布 | Flag 状态持久化于 metadata.settings |

## 2. Service Contracts
- **TaskService**
  ```ts
  export interface TaskService {
    create(input: TaskDraft, meta?: { source: 'local' | 'import' }): Promise<TaskRecord>;
    update(id: string, patch: TaskPatch, opts?: { optimistic?: boolean }): Promise<TaskRecord>;
    remove(id: string): Promise<void>;
    moveToQuadrant(id: string, quadrant: QuadrantId): Promise<TaskRecord>;
    bulkReplace(records: TaskRecord[], strategy: 'last-write-wins' | 'merge'): Promise<void>;
    onChange(listener: (event: TaskChangeEvent) => void): () => void;
  }
  ```
- **ReminderService**
  ```ts
  export interface ReminderService {
    start(strategy: BroadcastStrategy, visibilityWatcher: VisibilityWatcher): void;
    schedule(config: ReminderConfigRef): Promise<void>;
    updateState(id: string, state: 'scheduled' | 'snoozed' | 'fired' | 'dismissed'): Promise<void>;
    onError(listener: (error: ReminderError) => void): () => void;
  }
  ```
- **BackupService**
  ```ts
  export interface BackupService {
    export(kind: 'json' | 'csv'): Promise<Blob>;
    import(file: Blob, opts: { strategy: 'append' | 'replace' }): Promise<ImportReport>;
    validate(payload: unknown): ImportValidationResult;
  }
  ```
- **StorageAdapter**
  ```ts
  export interface StorageAdapter {
    open(): Promise<void>;
    transact<T>(fn: (ctx: StorageTransaction) => Promise<T>): Promise<T>;
    runMigration(targetVersion: number): Promise<void>;
    reset(): Promise<void>;
  }
  ```
  `StorageTransaction` 暴露 `tasks`, `reminders`, `metadata` CRUD API。
- **NotificationBridge**、**BroadcastStrategy**、**VisibilityWatcher** 保持原接口；需记录出错时 fallback/toast 行为。
- **错误语义**：Service 方法抛出 `TaskError | ReminderError | BackupError | StorageError`（包含 `code`, `message`, `recoverable`）；UI 捕获后提示用户并记录 telemetry。
- **幂等性**：`remove`, `bulkReplace`, `export/import` 需幂等；`create` 若 id 冲突需 rollback 并生成新 id。
- **事务语义**：taskService 在写入 tasks/reminders 时使用 storageAdapter transaction（idb transaction），失败时回滚 store 修改并显示错误。
- **可观察性**：`onChange`/`onError` 用于记录日志或 UI Badge 更新。

## 3. Data Model & Migration
### 3.1 Task & Related Records
| Field | Type | Constraints / Notes |
| --- | --- | --- |
| `id` | UUIDv4 string | keyPath；唯一索引；生成于 taskService |
| `title` | string | 1–80 chars；trim 后存储；空值报 validation error |
| `description` | string | 可空；<=2000 chars；后续支持 markdown |
| `importance/urgency` | integer | 1–5；Settings 阈值 1–5；越界报错 |
| `quadrant` | `'q1'|'q2'|'q3'|'q4'` | `computeQuadrant(task, settings)` 计算；用于查询与 UI |
| `dueDate` | ISO string (UTC) | 可空；date-fns 按 Settings 时区渲染 |
| `status` | `'active'|'completed'` | 完成时写 `stats.completedAt` |
| `tags` | string[] | 去重 + 小写化；未来 insights 用；可添加 `byTag` 索引 |
| `reminders` | `ReminderConfigRef[]` | `{ id, taskId, minutesBefore, fireAt, channel:'in-app', enabled }`；fireAt UTC |
| `stats` | object | `{ snoozeCount: number; completedAt?: string }`；仅 reminderService 修改 |
| `createdAt/updatedAt` | ISO string (UTC) | 由 taskService 设置；用于 last-write-wins |

### 3.2 Metadata / Settings
```ts
export interface MetadataRecord {
  schemaVersion: number; // default 1
  settings: {
    quadrantThreshold: { importance: number; urgency: number };
    timezone: string;
    theme: 'light' | 'dark' | 'system';
    betaFlags: Record<string, boolean>;
  };
}
```

### 3.3 IndexedDB Schema
- `tasks` store：keyPath `id`；indexes `byQuadrant`, `byDueDate`, `byUpdatedAt`
- `reminders` store：keyPath `id`；index `byFireAt`
- `metadata` store：key `'singleton'`

### 3.4 Migration Procedure
1. 打开 DB 时读取 `metadata.schemaVersion`
2. 若 < target：调用 `storageAdapter.runMigration(targetVersion)`，在 `openDB` upgrade callback 内：
   - 添加新字段/索引并给旧记录填默认值
   - 更新 `metadata.schemaVersion`
3. `storageAdapter` 记录 telemetry：`{ event:'migration', from, to, duration }`
4. 若 migration 抛错：
   - 自动触发 `backupService.export('json')` 并提示用户保存
   - 展示对话框：指导清缓存/重置，并提供按钮调用 `storageAdapter.reset()`
   - 记录 `StorageError`（含堆栈）方便调试
5. Settings 中提供“重置数据库”操作：
   - 引导用户先导出
   - 调 `storageAdapter.reset()` 清空 stores
   - 可选导入备份

### 3.5 Consistency
- 删除任务时 `taskService.remove` 同步删除 `reminders`（storageAdapter 事务确保一致）
- Broadcast 事件携带 `updatedAt`；接收方若本地记录较新则忽略
- Settings 更改阈值后触发全量 `computeQuadrant` 并写回 DB（批量 transaction）

## 4. Interaction Flows
1. **Task Creation**：Matrix/Settings 任意入口 → TaskForm → `taskService.create`（生成 UUID, quadrant, timestamps）→ storageAdapter transaction → Broadcast → Toast + Reminders reschedule。
2. **Quadrant Move**：DnD/Keyboard/in-context menu → `taskService.moveToQuadrant`（更新 importance/urgency 或直接 quadrant）→ storage + Broadcast；失败则 revert UI 并 toast。
3. **Reminder Scheduling**：`reminderScheduler.start(strategy, visibilityWatcher)` 订阅 store；对 future `fireAt` 使用 `setTimeout`；当 document hidden 时暂停；visibilitychange → 重新扫描；Notification 权限拒绝→notificationBridge.showToast。
4. **Backup/Import**：BackupPanel→`backupService.export(kind)`；Import 时 `validate` payload（schemaVersion, checksum），再调用 `bulkReplace`（`strategy='replace'`）执行事务；生成 `ImportReport`（新增/覆盖/失败数量）。
5. **Multi-tab Sync**：`useBroadcastSync` publish/subscribe；降级 storage event 时 Settings 显示警告；telemetry 记录 `sync.degraded=true`。
6. **Performance Telemetry**：TaskService/ReminderService 使用 `performance.mark/measure` 记录时长；Lighthouse CI 在 pipeline 中运行。

## 5. Module Topology
- `src/features/matrix`：MatrixView、Quadrant、TaskCard、TaskForm、TaskDetails、hooks/useMatrixInteractions。
- `src/features/reminders`：ReminderPanel、ReminderToastHost、hooks/useReminderPanel、services/reminderScheduler。
- `src/features/settings`：SettingsView、BackupPanel、ShortcutHelp、ThemeToggle。
- `src/features/calendar` / `src/features/insights`：Phase2/3 实现，当前仅 placeholder。
- `src/store`：taskStore（Zustand slices）、selectors、hydration helpers。
- `src/services`：taskService.ts, reminderService.ts, backupService.ts, telemetryService.ts。
- `src/storage`：indexedDbClient.ts, storageAdapter.ts, usePersistentStore.ts, migrations.ts。
- `src/infrastructure`：notificationBridge.ts, visibilityWatcher.ts, broadcastStrategy.ts。
- 依赖方向：UI → feature hooks → services → store/storage → infrastructure。

## 6. Testing & Validation Matrix
| Category | Scenario | Tooling | Pass Criteria |
| --- | --- | --- | --- |
| Unit | taskService CRUD + rollback | Vitest + fake-indexeddb | 100% branches for service；rollback 恢复原状态 |
| Unit | reminderService schedule/snooze | Vitest + fake timers | Snooze 重排 fireAt；onError 触发 fallback |
| Unit | backupService validation/export/import | Vitest | 校验失败抛 BackupError；导出包含 checksum，ImportReport 统计正确 |
| Selector | Quadrant filters w/ custom thresholds | Vitest | 100% branches；不同阈值得出正确集合 |
| Component | MatrixView drag + keyboard fallback | Testing Library + user-event + axe | DnD 成功、ARIA 信息正确、axe 无 violations |
| Component | ReminderPanel + Toast host | Testing Library + fake timers | Snooze 更新列表 & stats；toast 内容正确 |
| Component | BackupPanel | Testing Library + file mock | 上传错误文件显示 ValidationError |
| Integration | Persistence round-trip | Vitest + fake-indexeddb | 创建→刷新（rehydrate）后数据一致 |
| Integration | Broadcast sync & degradation | Vitest + mock BroadcastChannel/storage event | 正常模式两 tab 同步；禁用 Broadcast 时 fallback 执行 & UI 提示 |
| Integration | Reminder scheduler after visibilitychange | Playwright + fake timers | 隐藏→显示后漏掉的提醒被补发；telemetry 记录恢复 |
| Integration | Backup import/export (real blob) | Playwright (desktop) | 导出 JSON → 清库 → 导入 → 数据匹配；ImportReport 显示准确 |
| Performance | Lighthouse PWA + custom markers | Lighthouse CI, PerformanceObserver | PWA score ≥ 90；task create/drag/reminder ack p95 <200ms |
| Offline | Playwright offline mode | Service Worker + Playwright | 离线创建任务并刷新后仍存在 |
| Accessibility | NVDA/VoiceOver manual + axe | 手动 + axe | 所有关键流可通过键盘 & 读屏，axe 0 错误 |

Release Gate：上述测试全部通过；Playwright offline + Backup import/export 为阻塞项；任何 telemetry 报错必须处理或记录 known issue。

## 7. Risk Register
| Risk | Impact | Detection | Mitigation/Recovery |
| --- | --- | --- | --- |
| IndexedDB 容量/Quota | 写入失败、数据丢失 | storageAdapter 捕获 `DOMException`; telemetry 记录 | 提示导出后清理 completed tasks；Settings 提供“轻量模式”禁用历史 |
| Schema migration failure | 数据锁死 | upgrade 过程捕获异常 | 自动导出 JSON；指引用户清缓存→导入；提供“重置数据”按钮 |
| BroadcastChannel 缺失 | 多 Tab 不一致 | Feature detect；记录 telemetry | storage event fallback；Settings 显示“同步降级” |
| Browser sleep/节流 | 提醒延迟 | visibilityWatcher 记录 state | 恢复时全量重新 schedule；在 toast 中提醒用户保持标签页活跃 |
| 系统时钟漂移 | 提醒时间偏差 | 在 Settings 校验 `Date.now()` 差异 | 提示用户同步系统时间；允许手动修正 fireAt |
| Notification 权限被撤销 | 无原生提醒 | 每次启动检查权限 | UI 显示警告并自动 fallback toast |
| Backup 泄露/篡改 | 用户数据风险 | 校验 checksum；提示敏感性 | 导出时提示“包含敏感数据”；未来支持密码/云备份 |
| 备份损坏 | 导入失败 | validate payload | 报错并提供日志；建议重新导出 |
| 浏览器隐私模式 | IndexedDB 受限 | `navigator.storage.estimate` 返回小值 | 提示“隐私模式不建议长期使用”；提供只读提示 |
| 数据篡改/恶意脚本 | 数据不一致 | Import 校验 + telemetry | checksum + schemaVersion 校验；失败阻止导入 |

## 8. Iteration Plan
1. **Phase1 (MVP)**：实现 Matrix + Reminders + Settings/Backup + IndexedDB + Broadcast sync + Calendar/Insights placeholder + Service Worker + telemetry。
2. **Phase2**：Calendar 实际视图、Notification API 权限流程、快捷键扩展、Motion/Shortcut Playground。
3. **Phase3**：Insights 图表、云同步 hook、协作 beta、ActivityLog、加密备份。
