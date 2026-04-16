import { useMemo, useState } from 'react'
import { useTaskStore } from '../../store/taskStore'
import { Quadrant } from './components/Quadrant'
import { TaskForm } from './components/TaskForm'
import { TaskDetailsDrawer } from './components/TaskDetailsDrawer'
import { useMatrixInteractions } from './hooks/useMatrixInteractions'
import type { QuadrantId } from '../../models/task'
import { appendCompletedLog } from '../../services/dailyLogService'
import './styles/matrix.css'

const QUADRANTS: Array<{ id: QuadrantId; title: string }> = [
  { id: 'q2', title: '计划推进（重要不紧急）' },
  { id: 'q1', title: '立即执行（重要且紧急）' },
  { id: 'q4', title: '主动剔除（不重要不紧急）' },
  { id: 'q3', title: '委派处理（不重要但紧急）' },
]

export function MatrixView() {
  const allTasks = useTaskStore((state) => state.tasks)
  const tasks = useMemo(() => allTasks.filter((t) => t.status !== 'completed'), [allTasks])
  const addTask = useTaskStore((state) => state.addTask)
  const updateTask = useTaskStore((state) => state.updateTask)
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
          <h1>重要性 x 紧急性矩阵</h1>
          <p>以量子态专注模型平衡价值与时压，把精力投向真正关键的任务。</p>
        </div>
        <button type="button" onClick={() => setIsFormOpen(true)}>
          新建任务
        </button>
      </section>

      <section className="matrix-stats" aria-label="矩阵统计">
        <div>
          <strong>{tasks.length}</strong>
          <span>任务总量</span>
        </div>
        <div>
          <strong>{taskByQuadrant.q1.length}</strong>
          <span>立即执行</span>
        </div>
        <div>
          <strong>{taskByQuadrant.q2.length}</strong>
          <span>计划推进</span>
        </div>
      </section>

      <section className="matrix-grid" aria-label="四象限任务区域">
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
            onCompleteTask={(taskId) => {
              const task = tasks.find((item) => item.id === taskId)
              if (!task) return
              updateTask(taskId, { status: 'completed' })
              try {
                appendCompletedLog(task)
              } catch (error) {
                console.warn('daily log write failed', error)
              }
            }}
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
      <TaskDetailsDrawer
        task={selectedTask}
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={(taskId, patch) => {
          updateTask(taskId, patch)
        }}
      />
    </div>
  )
}

export default MatrixView
