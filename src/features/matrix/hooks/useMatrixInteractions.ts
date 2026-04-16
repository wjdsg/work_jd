import type { DragEvent } from 'react'
import { QuadrantId } from '../../../models/task'
import { useTaskStore } from '../../../store/taskStore'

const DOWNWARD_QUADRANT: Record<QuadrantId, QuadrantId> = {
  q1: 'q3',
  q2: 'q4',
  q3: 'q4',
  q4: 'q4',
}

const UPWARD_QUADRANT: Record<QuadrantId, QuadrantId> = {
  q1: 'q1',
  q2: 'q1',
  q3: 'q1',
  q4: 'q2',
}

const RIGHTWARD_QUADRANT: Record<QuadrantId, QuadrantId> = {
  q1: 'q1',
  q2: 'q1',
  q3: 'q3',
  q4: 'q4',
}

const LEFTWARD_QUADRANT: Record<QuadrantId, QuadrantId> = {
  q1: 'q1',
  q2: 'q2',
  q3: 'q3',
  q4: 'q2',
}

const QUADRANT_TO_SCORE: Record<QuadrantId, { importance: number; urgency: number }> = {
  q1: { importance: 10, urgency: 10 },
  q2: { importance: 10, urgency: 1 },
  q3: { importance: 1, urgency: 10 },
  q4: { importance: 1, urgency: 1 },
}

function resolveQuadrantByArrow(current: QuadrantId, key: string): QuadrantId {
  if (key === 'ArrowDown') return DOWNWARD_QUADRANT[current]
  if (key === 'ArrowUp') return UPWARD_QUADRANT[current]
  if (key === 'ArrowRight') return RIGHTWARD_QUADRANT[current]
  if (key === 'ArrowLeft') return LEFTWARD_QUADRANT[current]
  return current
}

export function useMatrixInteractions() {
  const updateTask = useTaskStore((state) => state.updateTask)

  function moveTaskToQuadrant(taskId: string, quadrant: QuadrantId) {
    const score = QUADRANT_TO_SCORE[quadrant]
    updateTask(taskId, {
      importance: score.importance,
      urgency: score.urgency,
    })
  }

  function handleDragStart(taskId: string, event: DragEvent<HTMLElement>) {
    event.dataTransfer.setData('text/task-id', taskId)
    event.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(event: DragEvent<HTMLElement>, quadrant: QuadrantId) {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/task-id')
    if (!taskId) return
    moveTaskToQuadrant(taskId, quadrant)
  }

  function handleTaskKeyMove(taskId: string, currentQuadrant: QuadrantId, key: string) {
    const nextQuadrant = resolveQuadrantByArrow(currentQuadrant, key)
    if (nextQuadrant === currentQuadrant) return
    moveTaskToQuadrant(taskId, nextQuadrant)
  }

  return {
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleTaskKeyMove,
  }
}
