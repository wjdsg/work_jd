import { useMemo, useState } from 'react'
import { useTaskStore } from '../../store/taskStore'
import { Quadrant } from './components/Quadrant'
import { TaskForm } from './components/TaskForm'
import { TaskDetailsDrawer } from './components/TaskDetailsDrawer'
import { useMatrixInteractions } from './hooks/useMatrixInteractions'
import type { QuadrantId } from '../../models/task'
import './styles/matrix.css'

const QUADRANTS: Array<{ id: QuadrantId; title: string }> = [
  { id: 'q1', title: 'Do now (Important + Urgent)' },
  { id: 'q2', title: 'Plan (Important + Not urgent)' },
  { id: 'q3', title: 'Delegate (Not important + Urgent)' },
  { id: 'q4', title: 'Eliminate (Not important + Not urgent)' },
]

export function MatrixView() {
  const tasks = useTaskStore((state) => state.tasks)
  const addTask = useTaskStore((state) => state.addTask)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const { handleDragStart, handleDragOver, handleDrop, handleTaskKeyMove } = useMatrixInteractions()

  const taskByQuadrant = useMemo(() => {
    return {
      q1: tasks.filter((task) => task.quadrant === 'q1'),
      q2: tasks.filter((task) => task.quadrant === 'q2'),
      q3: tasks.filter((task) => task.quadrant === 'q3'),
      q4: tasks.filter((task) => task.quadrant === 'q4'),
    }
  }, [tasks])

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null

  return (
    <div className="matrix-view">
      <section className="matrix-header">
        <div>
          <h1>Importance x Urgency Matrix</h1>
          <p>Focus on meaningful work by balancing impact and time pressure.</p>
        </div>
        <button type="button" onClick={() => setIsFormOpen(true)}>
          Add Task
        </button>
      </section>

      <section className="matrix-stats" aria-label="Matrix statistics">
        <div>
          <strong>{tasks.length}</strong>
          <span>Total tasks</span>
        </div>
        <div>
          <strong>{taskByQuadrant.q1.length}</strong>
          <span>Do now</span>
        </div>
        <div>
          <strong>{taskByQuadrant.q2.length}</strong>
          <span>Planned</span>
        </div>
      </section>

      <section className="matrix-grid" aria-label="Importance urgency quadrants">
        {QUADRANTS.map((quadrant) => (
          <Quadrant
            key={quadrant.id}
            quadrantId={quadrant.id}
            title={quadrant.title}
            tasks={taskByQuadrant[quadrant.id]}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onTaskDragStart={handleDragStart}
            onTaskKeyMove={(taskId, key) => {
              const task = tasks.find((item) => item.id === taskId)
              if (!task) return
              handleTaskKeyMove(taskId, task.quadrant, key)
            }}
            onOpenDetails={setSelectedTaskId}
          />
        ))}
      </section>

      <TaskForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={(draft) => {
          addTask(draft)
        }}
      />
      <TaskDetailsDrawer task={selectedTask} open={Boolean(selectedTask)} onClose={() => setSelectedTaskId(null)} />
    </div>
  )
}

export default MatrixView
