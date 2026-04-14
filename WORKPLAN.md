<!-- Author: mjw -->
<!-- Date: 2026-04-13 -->

# Core Matrix Work Plan

## Objectives
- Define task schema covering importance, urgency, deadlines, reminders
- Build Eisenhower matrix UI with drag-and-drop between quadrants
- Implement filtering, sorting, and search for core task list
- Provide state management hooks/services consumable by other modules

## Deliverables
1. `src/models/task.ts` with strong typing for task attributes and local persistence metadata
2. `src/services/taskRepository.ts` using IndexedDB gateway
3. `src/features/matrix` React/Vue module with reusable quadrant components
4. Unit tests covering task operations and quadrant logic

## Milestones
- Week 1: Task schema + repository layer prototype
- Week 2: Matrix UI skeleton + drag interactions
- Week 3: Polish interactions, accessibility, and documentation
