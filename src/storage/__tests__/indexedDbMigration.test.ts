// Author: mjw
// Date: 2026-04-16

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computeQuadrant } from '../../models/task'

const openDBMock = vi.fn()

vi.mock('idb', () => {
  return {
    openDB: (...args: unknown[]) => openDBMock(...args),
  }
})

describe('indexedDB migration', () => {
  beforeEach(() => {
    openDBMock.mockReset()
  })

  it('migrates v1 records from 1-5 scale to 1-10 scale with quadrant recompute', async () => {
    const taskStore = {
      getAll: vi.fn().mockResolvedValue([
        {
          id: 'task_m1',
          title: 'legacy',
          importance: 5,
          urgency: 3,
          quadrant: 'q2',
        },
      ]),
      put: vi.fn().mockResolvedValue(undefined),
    }
    const metadataStore = {
      get: vi.fn().mockResolvedValue({
        key: 'singleton',
        schemaVersion: 1,
        settings: {
          quadrantThreshold: { importance: 4, urgency: 4 },
          timezone: 'Asia/Shanghai',
          theme: 'system',
          betaFlags: {},
        },
      }),
      put: vi.fn().mockResolvedValue(undefined),
    }
    const tx = {
      objectStore: vi.fn((name: string) => {
        if (name === 'tasks') return taskStore
        if (name === 'metadata') return metadataStore
        return undefined
      }),
    }

    openDBMock.mockImplementation(async (_name, _version, options) => {
      await options.upgrade({}, 1, 2, tx)
      return { get: vi.fn(), put: vi.fn() }
    })

    const { getDB } = await import('../indexedDbClient')
    await getDB()

    expect(taskStore.put).toHaveBeenCalledWith({
      id: 'task_m1',
      title: 'legacy',
      importance: 10,
      urgency: 6,
      quadrant: computeQuadrant(10, 6, 8, 8),
    })
    expect(metadataStore.put).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'singleton',
        schemaVersion: 2,
        settings: expect.objectContaining({
          quadrantThreshold: { importance: 8, urgency: 8 },
        }),
      }),
    )
  })

  it('does not re-run v1->v2 migration when oldVersion is already 2', async () => {
    const taskStore = {
      getAll: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue(undefined),
    }
    const metadataStore = {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    }
    const tx = {
      objectStore: vi.fn((name: string) => {
        if (name === 'tasks') return taskStore
        if (name === 'metadata') return metadataStore
        return undefined
      }),
    }

    openDBMock.mockImplementation(async (_name, _version, options) => {
      await options.upgrade({}, 2, 3, tx)
      return { get: vi.fn(), put: vi.fn() }
    })

    vi.resetModules()
    const { getDB } = await import('../indexedDbClient')
    await getDB()

    expect(taskStore.getAll).toHaveBeenCalledTimes(1)
    expect(metadataStore.put).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaVersion: 3,
      }),
    )
  })

  it('migrates v2 records to v3 by adding startDate and estimatedDays', async () => {
    const taskStore = {
      getAll: vi.fn().mockResolvedValue([
        {
          id: 'task_v2_1',
          title: 'task without dates',
          importance: 8,
          urgency: 7,
          quadrant: 'q1',
          createdAt: '2026-04-15T10:00:00.000Z',
        },
        {
          id: 'task_v2_2',
          title: 'task with startDate but no estimatedDays',
          importance: 5,
          urgency: 3,
          quadrant: 'q3',
          createdAt: '2026-04-10T08:00:00.000Z',
          startDate: '2026-04-11T08:00:00.000Z',
          dueDate: '2026-04-14T08:00:00.000Z',
        },
        {
          id: 'task_v2_3',
          title: 'task already has all fields',
          importance: 6,
          urgency: 6,
          quadrant: 'q1',
          createdAt: '2026-04-01T00:00:00.000Z',
          startDate: '2026-04-01T00:00:00.000Z',
          estimatedDays: 5,
          dueDate: '2026-04-06T00:00:00.000Z',
        },
      ]),
      put: vi.fn().mockResolvedValue(undefined),
    }
    const metadataStore = {
      get: vi.fn().mockResolvedValue({
        key: 'singleton',
        schemaVersion: 2,
        settings: {
          quadrantThreshold: { importance: 8, urgency: 8 },
          timezone: 'Asia/Shanghai',
          theme: 'system',
          betaFlags: {},
        },
      }),
      put: vi.fn().mockResolvedValue(undefined),
    }
    const tx = {
      objectStore: vi.fn((name: string) => {
        if (name === 'tasks') return taskStore
        if (name === 'metadata') return metadataStore
        return undefined
      }),
    }

    openDBMock.mockImplementation(async (_name, _version, options) => {
      await options.upgrade({}, 2, 3, tx)
      return { get: vi.fn(), put: vi.fn() }
    })

    vi.resetModules()
    const { getDB } = await import('../indexedDbClient')
    await getDB()

    expect(taskStore.put).toHaveBeenCalledTimes(3)

    expect(taskStore.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task_v2_1',
        startDate: '2026-04-15T10:00:00.000Z',
        dueDate: '2026-04-16T10:00:00.000Z',
        estimatedDays: 1,
      }),
    )

    expect(taskStore.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task_v2_2',
        startDate: '2026-04-11T08:00:00.000Z',
        dueDate: '2026-04-14T08:00:00.000Z',
        estimatedDays: 3,
      }),
    )

    expect(taskStore.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task_v2_3',
        startDate: '2026-04-01T00:00:00.000Z',
        estimatedDays: 5,
        dueDate: '2026-04-06T00:00:00.000Z',
      }),
    )

    expect(metadataStore.put).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'singleton',
        schemaVersion: 3,
      }),
    )
  })

  it('does not re-run migration when oldVersion is already 3', async () => {
    const taskStore = {
      getAll: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue(undefined),
    }
    const metadataStore = {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    }
    const tx = {
      objectStore: vi.fn((name: string) => {
        if (name === 'tasks') return taskStore
        if (name === 'metadata') return metadataStore
        return undefined
      }),
    }

    openDBMock.mockImplementation(async (_name, _version, options) => {
      await options.upgrade({}, 3, 3, tx)
      return { get: vi.fn(), put: vi.fn() }
    })

    vi.resetModules()
    const { getDB } = await import('../indexedDbClient')
    await getDB()

    expect(taskStore.getAll).not.toHaveBeenCalled()
    expect(metadataStore.put).not.toHaveBeenCalled()
  })
})
