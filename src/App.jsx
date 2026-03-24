import { useState, useEffect, useCallback } from 'react'
import { TASKS } from './data/tasks'
import { getTotalXP, getTaskState, updateTask, addXP, subtractXP, undoTask, getStreak, checkAndUpdateStreak } from './lib/store'
import { calcXP, getPraise, getLevelInfo } from './lib/xp'
import { requestPermission, registerSW, scheduleAll, listenForActions } from './lib/notifications'
import XPBar from './components/XPBar'
import TaskCard from './components/TaskCard'
import Toast from './components/Toast'

export default function App() {
  const [totalXP, setTotalXP] = useState(getTotalXP)
  const [streak, setStreak] = useState(getStreak)
  const [taskStates, setTaskStates] = useState(() => {
    const s = {}
    TASKS.forEach(t => { s[t.id] = getTaskState(t.id) })
    return s
  })
  const [toast, setToast] = useState(null)
  const [notifGranted, setNotifGranted] = useState(
    typeof Notification !== 'undefined' ? Notification.permission === 'granted' : false
  )
  const [swReady, setSwReady] = useState(false)

  const refreshStates = useCallback(() => {
    const s = {}
    TASKS.forEach(t => { s[t.id] = getTaskState(t.id) })
    setTaskStates(s)
    setTotalXP(getTotalXP())
    setStreak(getStreak())
  }, [])

  const handleDone = useCallback((taskId) => {
    const task = TASKS.find(t => t.id === taskId)
    const state = getTaskState(taskId)
    if (state.status === 'done') return

    const [h, m] = task.time.split(':').map(Number)
    const scheduled = new Date()
    scheduled.setHours(h, m, 0, 0)
    const isOnTime = Date.now() <= scheduled.getTime() + 10 * 60 * 1000

    const xp = calcXP(task, state.snoozeCount || 0, isOnTime)
    updateTask(taskId, { status: 'done', xpEarned: xp, doneAt: Date.now() })
    const newTotal = addXP(xp)
    const newStreak = checkAndUpdateStreak()

    setTotalXP(newTotal)
    setStreak(newStreak)
    refreshStates()
    setToast({ message: getPraise(), xp })

    if (swReady) {
      const updated = {}
      TASKS.forEach(t => { updated[t.id] = getTaskState(t.id) })
      scheduleAll(TASKS, updated)
    }
  }, [refreshStates, swReady])

  const handleUndo = useCallback((taskId) => {
    const xpToRemove = undoTask(taskId)
    const newTotal = subtractXP(xpToRemove)
    setTotalXP(newTotal)
    refreshStates()
    if (swReady) {
      const updated = {}
      TASKS.forEach(t => { updated[t.id] = getTaskState(t.id) })
      scheduleAll(TASKS, updated)
    }
  }, [refreshStates, swReady])

  useEffect(() => {
    registerSW().then(reg => {
      if (reg) setSwReady(true)
    })
  }, [])

  useEffect(() => {
    if (!swReady) return
    scheduleAll(TASKS, taskStates)
    const unsub = listenForActions(({ action, taskId }) => {
      if (action === 'done') {
        handleDone(taskId)
      } else if (action === 'snooze') {
        const state = getTaskState(taskId)
        updateTask(taskId, { snoozeCount: (state.snoozeCount || 0) + 1 })
        refreshStates()
      }
    })
    return unsub
  }, [swReady, handleDone, refreshStates])

  const handleEnableNotifications = async () => {
    const granted = await requestPermission()
    setNotifGranted(granted)
    if (granted && swReady) scheduleAll(TASKS, taskStates)
  }

  const done = TASKS.filter(t => taskStates[t.id]?.status === 'done').length
  const total = TASKS.length
  const { current } = getLevelInfo(totalXP)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-md mx-auto px-4 py-8 space-y-5">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">
            Day<span style={{ color: current.color }}>Forge</span>
          </h1>
          <div className="text-sm text-gray-400">{done}/{total} tasks</div>
        </div>

        <XPBar totalXP={totalXP} streak={streak} />

        {!notifGranted && (
          <button
            onClick={handleEnableNotifications}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 font-semibold text-white transition-colors text-sm"
          >
            ⌚ Enable Apple Watch Notifications
          </button>
        )}

        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Today&apos;s progress</span>
            <span>{Math.round((done / total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(done / total) * 100}%`, background: current.color }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {TASKS.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              state={taskStates[task.id] || {}}
              onDone={handleDone}
              onUndo={handleUndo}
            />
          ))}
        </div>

        <p className="text-center text-xs text-gray-600 pb-4">
          Add to Home Screen for Watch notifications
          <br />
          <span className="text-gray-700">v{__APP_VERSION__}</span>
        </p>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          xp={toast.xp}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  )
}
