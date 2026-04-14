// Author: mjw
// Date: 2026-04-13

import { useState, useCallback } from 'react'
import { Quadrant } from '@/models/task'

interface DragItem {
  id: string
  type: 'task'
  currentQuadrant: Quadrant
}

export interface DragState {
  isDragging: boolean
  draggedItem: DragItem | null
  dragOverQuadrant: Quadrant | null
}

export function useDragAndDrop(onDrop: (taskId: string, targetQuadrant: Quadrant) => void) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOverQuadrant: null,
  })

  const handleDragStart = useCallback((taskId: string, currentQuadrant: Quadrant) => {
    setDragState({
      isDragging: true,
      draggedItem: { id: taskId, type: 'task', currentQuadrant },
      dragOverQuadrant: null,
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, quadrant: Quadrant) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragState((prev) => ({
      ...prev,
      dragOverQuadrant: quadrant,
    }))
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      dragOverQuadrant: null,
    }))
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetQuadrant: Quadrant) => {
      e.preventDefault()
      if (dragState.draggedItem && dragState.draggedItem.currentQuadrant !== targetQuadrant) {
        onDrop(dragState.draggedItem.id, targetQuadrant)
      }
      setDragState({
        isDragging: false,
        draggedItem: null,
        dragOverQuadrant: null,
      })
    },
    [dragState.draggedItem, onDrop]
  )

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOverQuadrant: null,
    })
  }, [])

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  }
}