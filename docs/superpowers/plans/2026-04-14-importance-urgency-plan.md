# Importance × Urgency Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the MVP version of the importance × urgency workspace: matrix UI, task data model, local persistence, in-app reminders, backup/import, and shell placeholders for calendar/insights.

**Architecture:** Single Vite + React + TypeScript SPA with feature-based directories. Zustand store handles tasks/reminders/settings; storage adapter wraps IndexedDB for persistence. Services (task/reminder/backup) expose typed contracts. UI modules consume services via feature hooks.

**Tech Stack:** Vite, React 18, TypeScript 5, Zustand, idb, React Router, Testing Library, Vitest, Playwright, Workbox.

---

## File Structure Overview

- `src/main.tsx`, `src/App.tsx`, `src/layouts/WorkspaceLayout.tsx`
- `src/styles/global.css`, `src/styles/tokens.css`
- `src/store/taskStore.ts`, `src/store/selectors.ts`
- `src/services/{taskService,reminderService,backupService,telemetryService}.ts`
- `src/storage/indexedDbClient.ts`, `src/storage/storageAdapter.ts`, `src/storage/usePersistentStore.ts`, `src/storage/migrations.ts`
- `src/features/matrix/*`, `src/features/reminders/*`, `src/features/settings/*`, `src/features/calendar/*`, `src/features/insights/*`
- `src/infrastructure/{notificationBridge,visibilityWatcher,broadcastStrategy}.ts`
- Test files mirrored alongside modules (`__tests__`)
- SW config `src/sw.ts` (Workbox)

---

## Task 1: Tooling & Project Baseline

**Files:**
- Modify: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `.gitignore`
- Create: `tsconfig.app.json`, `vitest.config.ts`, `vitest.setup.ts`, `src/styles/global.css`, `src/styles/tokens.css`, `src/main.tsx`, `src/App.tsx`
- Test: `npm run lint`, `npm run test`

- [ ] **Step 1:** Update `package.json` scripts (`dev`, `build`, `lint`, `test`, `typecheck`, `preview`) and add dependencies (`react-router-dom`, `zustand`, `idb`, `date-fns`, `@radix-ui/react-dialog`, `clsx`, `workbox-window`, testing deps).
- [ ] **Step 2:** Configure `tsconfig.json` with references to `tsconfig.app.json` + workspace tsconfigs; add `tsconfig.app.json` (extends base); `tsconfig.node.json` for Vite config.
- [ ] **Step 3:** Add `vitest.config.ts` (jsdom, setup file, coverage). Create `vitest.setup.ts` to import `@testing-library/jest-dom`.
- [ ] **Step 4:** Author global styles (`src/styles/global.css`, `src/styles/tokens.css`).
- [ ] **Step 5:** Scaffold `src/main.tsx` (ReactDOM.render App) and `src/App.tsx` (placeholder layout).
- [ ] **Step 6:** Run `npm install`, `npm run lint`, `npm run test` to ensure baseline passes.

---

## Task 2: Core Layout & Routing

**Files:**
- Create: `src/layouts/WorkspaceLayout.tsx`, `src/components/NavRail.tsx`, `src/components/HeaderBar.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Create: `src/routes/index.tsx`
- Tests: `src/routes/__tests__/routing.test.tsx`

- [ ] **Step 1:** Implement `WorkspaceLayout` (Nav, Header, Content, responsive media queries).
- [ ] **Step 2:** Build `NavRail` with route links + active states; mobile bottom nav fallback.
- [ ] **Step 3:** Build `HeaderBar` (date, search placeholder, shortcut button).
- [ ] **Step 4:** Wire React Router with routes `/matrix`, `/calendar`, `/reminders`, `/insights`, `/settings`; lazy-load feature placeholders.
- [ ] **Step 5:** Add tests verifying route render + nav states.

---

## Task 3: State Store & Selectors

**Files:**
- Create: `src/store/taskStore.ts`, `src/store/reminderStore.ts`, `src/store/settingsStore.ts`, selectors + tests
- Create: `src/models/task.ts`, `src/models/reminder.ts`, `src/models/settings.ts`

- [ ] **Step 1:** Update TypeScript models with validation helpers (TaskRecord, ReminderConfigRef, UserSettings) and default constants.
- [ ] **Step 2:** Implement Zustand store slices for tasks/reminders/settings (actions: add/update/remove/move/snooze, hydrate, clear).
- [ ] **Step 3:** Add selectors for quadrant lists, reminder queue, stats, filters; include tests.
- [ ] **Step 4:** Ensure stores expose hydration actions and selectors integrate with future persistence.

---

## Task 4: Storage Adapter, Persistence, Migration Recovery & Sync

**Files:**
- Create: `src/storage/indexedDbClient.ts`, `src/storage/storageAdapter.ts`, `src/storage/usePersistentStore.ts`, `src/storage/migrations.ts`, `src/storage/__tests__/storageAdapter.test.ts`
- Create: `src/hooks/useBroadcastSync.ts`, `src/infrastructure/storageDegradationIndicator.ts`

- [ ] **Step 1:** Build indexedDB client with `openDB`, stores (tasks/reminders/metadata), upgrade logic.
- [ ] **Step 2:** Implement `storageAdapter` with `open`, `transact`, CRUD methods, `runMigration`, `reset`, telemetry hooks for errors.
- [ ] **Step 3:** Implement `usePersistentStore` hook to hydrate Zustand store on load and persist changes (debounced).
- [ ] **Step 4:** Implement `useBroadcastSync` hook using `broadcastStrategy` + storage event fallback, update Settings badge when degraded; integrate into App shell.
- [ ] **Step 5:** Write tests using fake BroadcastChannel/storage event verifying sync + degradation handling.
- [ ] **Step 6:** Extend Settings state slice to store sync status + migration errors (used later).
- [ ] **Step 7:** Write tests using `fake-indexeddb` verifying CRUD, migration success, migration failure fallback (auto export JSON).
- [ ] **Step 8:** Write integration tests for `useBroadcastSync` ensuring Broadcast/degraded modes update Settings state and trigger telemetry.
- [ ] **Step 9:** Add Vitest integration test for persistence round-trip (create task -> simulate reload via `usePersistentStore` -> ensure data restored).

---

## Task 5: Services Layer

**Files:**
- Create: `src/services/taskService.ts`, `src/services/reminderService.ts`, `src/services/backupService.ts`, `src/services/telemetryService.ts`
- Create tests for each under `src/services/__tests__/`

- [ ] **Step 1:** Implement `taskService` per contract (create/update/remove/move/bulkReplace, onChange, error handling, rollback logic, telemetry events).
- [ ] **Step 2:** Implement `reminderService` with scheduler, snooze logic, visibility watcher integration, onError telemetry.
- [ ] **Step 3:** Implement `backupService` (JSON/CSV export with checksum, import validation, ImportReport, checksum verification).
- [ ] **Step 4:** Implement simple `telemetryService` capturing events to console/log buffer.
- [ ] **Step 5:** Unit tests for service behaviors (using fake timers, fake storage adapter).

---

## Task 6: Infrastructure Utilities

**Files:**
- Create: `src/infrastructure/notificationBridge.ts`, `src/infrastructure/visibilityWatcher.ts`, `src/infrastructure/broadcastStrategy.ts`
- Tests under `src/infrastructure/__tests__/`

- [ ] **Step 1:** Implement `notificationBridge` (permission request, showNative, showToast fallback, error telemetry).
- [ ] **Step 2:** Implement `visibilityWatcher` (subscribe to `visibilitychange`).
- [ ] **Step 3:** Implement `broadcastStrategy` (BroadcastChannel + storage event fallback, supportsNative flag).

---

## Task 7: Matrix Feature

**Scope update (due to repository state reset):**
- Previously existing matrix implementation remains (default core-matrix). To align with current minimal approach, Task7 now focuses on integrating new data store/persistence with a redeveloped matrix UI.

**Files:**
- Create (overriding previous ones): `src/features/matrix/MatrixView.tsx`, `components/Quadrant.tsx`, `components/TaskCard.tsx`, `components/TaskForm.tsx`, `components/TaskDetailsDrawer.tsx`, `hooks/useMatrixInteractions.ts`
- Create CSS modules under `src/features/matrix/styles`
- Tests: `src/features/matrix/__tests__/matrixView.test.tsx`

- [ ] **Step 1:** Re-implement clean Matrix module: layout grid, summary stats, empty states.
- [ ] **Step 2:** Implement `TaskCard` with drag handles, keyboard shortcuts, accessible markup.
- [ ] **Step 3:** Build TaskForm modal (title, importance/urgency sliders, deadline, tags, reminder toggle) integrated with store actions.
- [ ] **Step 4:** Implement drag & drop via custom `useMatrixInteractions` hook (HTML5 DnD + keyboard fallback, watchers for broadcast sync updates).
- [ ] **Step 5:** Add TaskDetails drawer showing history/notes placeholder.
- [ ] **Step 6:** Tests covering render, drag/keyboard, form validation, using @testing-library/react + axe.

---

## Task 8: Reminder Feature

**Files:**
- Create: `src/features/reminders/ReminderPanel.tsx`, `ReminderToastHost.tsx`, `hooks/useReminderPanel.ts`, CSS modules
- Tests: `src/features/reminders/__tests__/reminderPanel.test.tsx`

- [ ] **Step 1:** Build Reminders panel (filters for today/upcoming/completed, actions for snooze/dismiss).
- [ ] **Step 2:** Implement toast host component hooking into reminderService onChange/onError.
- [ ] **Step 3:** Connect ReminderScheduler to store + visibility watcher.
- [ ] **Step 4:** Implement explicit user notification when browser sleeps (toast message explaining potential delays) and log telemetry event.
- [ ] **Step 5:** Tests for reminder list, snooze flow, toast fallback, and sleep warning display.

---

## Task 9: Settings, Backup & Risk Mitigations

**Files:**
- Create: `src/features/settings/SettingsView.tsx`, `BackupPanel.tsx`, `ShortcutHelp.tsx`, `ThemeToggle.tsx`
- Tests: `src/features/settings/__tests__/settingsView.test.tsx` (target backup + theme toggle)

- [ ] **Step 1:** Build Settings view (theme toggle, timezone selection, threshold sliders, beta flag toggles, sync status chip).
- [ ] **Step 2:** Implement BackupPanel UI (export JSON/CSV buttons, import drop zone, status display using ImportReport, checksum warnings).
- [ ] **Step 3:** Implement ShortcutHelp (modal listing keyboard shortcuts).
- [ ] **Step 4:** Add “重置数据库” CTA：检测 storageAdapter.failures/migration errors，提示导出，并调用 `storageAdapter.reset()`；显示 storage estimate (quota)、“隐私模式”警告、系统时钟漂移提示。
- [ ] **Step 5:** Tests for backup import/export, reset flow, storage estimate warnings, sync status chip, timezone/threshold updates, clock drift warning.

---

## Task 10: Calendar & Insights Placeholders

**Files:**
- Create: `src/features/calendar/CalendarPlaceholder.tsx`, `src/features/insights/InsightsPlaceholder.tsx`
- Minimal CSS

- [ ] **Step 1:** Add simple placeholder cards describing future functionality; ensure routes render without errors.

---

## Task 11: Service Worker, Telemetry, Performance Monitoring

**Files:**
- Create: `src/sw.ts` (Workbox), configure `vite.config.ts` for SW build
- Add telemetry logging utilities

- [ ] **Step 1:** Configure Workbox to precache build assets and provide offline shell (no dynamic data caches yet).
- [ ] **Step 2:** Add telemetry hooks + PerformanceObserver wiring (task/reminder marks, console logging/potential event logger).
- [ ] **Step 3:** Implement telemetry hooks for IndexedDB failures, reminder errors, Broadcast degradation; log via `telemetryService`.
- [ ] **Step 4:** Add PerformanceObserver instrumentation (marks `task.create`, `task.drag`, `reminder.ack`) and expose stats to console/log.
- [ ] **Step 5:** Integrate Lighthouse CI script/command to enforce PWA score.
- [ ] **Step 6:** Provide helper functions for system clock drift detection + show warnings via Settings (already referenced in Task9).

---

## Task 12: QA & Verification (per Testing Matrix)

**Files:**
- None (scripts/tests)

- [ ] **Step 1:** Run `npm run lint`
- [ ] **Step 2:** Run `npm run test`
- [ ] **Step 3:** Run `npm run build`
- [ ] **Step 4:** Run Lighthouse CI (PWA score ≥ 90) & analyze PerformanceObserver logs ensure `task.create/drag/reminder ack` <200ms p95.
- [ ] **Step 5:** Playwright offline scenario (create task offline, refresh, verify persistence)
- [ ] **Step 6:** Playwright backup import/export scenario (export JSON, clear storage, import, verify data matches)
- [ ] **Step 7:** Integration test for Broadcast sync & degradation (two tabs, disable Broadcast, confirm storage event fallback + UI warning, telemetry event recorded)
- [ ] **Step 8:** Reminder scheduler after visibilitychange (simulate hidden tab, resume, ensure missed reminder fires + telemetry recorded)
- [ ] **Step 9:** Integration test for migration failure recovery (force upgrade error, verify auto export + reset CTA)
- [ ] **Step 10:** Manual QA checklist (drag/drop + keyboard + screen-reader, reminders snooze/dismiss, backup reset + import, multi-tab sync & degradation warning, mobile layout, quota/clock warnings, Notification permission handling)

---
