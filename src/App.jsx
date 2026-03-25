import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { TASKS } from './data/tasks'
import { getTotalXP, getTaskState, updateTask, addXP, subtractXP, undoTask, getStreak, checkAndUpdateStreak } from './lib/store'
import { calcXP, getPraise, getLevelInfo } from './lib/xp'
import { requestPermission, registerSW, scheduleAll, listenForActions, fireTestNotification } from './lib/notifications'
import { getCustomTimes, setCustomTime } from './lib/customTimes'
import { getCustomTasks, addCustomTask, removeCustomTask } from './lib/customTasks'
import { haptic } from './lib/haptics'
import XPBar from './components/XPBar'
import TaskCard from './components/TaskCard'
import Toast from './components/Toast'
import SleepWidget from './components/SleepWidget'
import HistoryView from './components/HistoryView'
import AddTaskForm from './components/AddTaskForm'

function formatDate() {
  return new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function App() {
  const [totalXP, setTotalXP]         = useState(getTotalXP)
  const [streak, setStreak]           = useState(getStreak)
  const [customTimes, setCustomTimes] = useState(getCustomTimes)
  const [customTaskList, setCustomTaskList] = useState(getCustomTasks)
  const [tab, setTab]                 = useState('today')
  const [taskStates, setTaskStates]   = useState(() => {
    const s = {}
    ;[...TASKS, ...getCustomTasks()].forEach(t => { s[t.id] = getTaskState(t.id) })
    return s
  })
  const [toast, setToast]             = useState(null)
  const [notifGranted, setNotifGranted] = useState(
    typeof Notification !== 'undefined' ? Notification.permission === 'granted' : false
  )
  const [swReady, setSwReady]         = useState(false)
  const [, tick]                      = useState(0) // minute ticker for relative times

  const activeTasks = useMemo(() => [
    ...TASKS.map(t => ({ ...t, time: customTimes[t.id] || t.time })),
    ...customTaskList,
  ].sort((a, b) => a.time.localeCompare(b.time)), [customTimes, customTaskList])

  const activeTasksRef = useRef(activeTasks)
  useEffect(() => { activeTasksRef.current = activeTasks }, [activeTasks])

  const refreshStates = useCallback(() => {
    const allIds = [...TASKS.map(t => t.id), ...getCustomTasks().map(t => t.id)]
    const s = {}
    allIds.forEach(id => { s[id] = getTaskState(id) })
    setTaskStates(s)
    setTotalXP(getTotalXP())
    setStreak(getStreak())
  }, [])

  const nextTaskId = useMemo(() => {
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
    const pending = activeTasks.filter(t => taskStates[t.id]?.status !== 'done')
    if (!pending.length) return null
    const upcoming = pending.find(t => {
      const [h, m] = t.time.split(':').map(Number)
      return h * 60 + m >= nowMin
    })
    return (upcoming || pending[pending.length - 1]).id
  }, [activeTasks, taskStates])

  const handleDone = useCallback((taskId) => {
    const task = activeTasksRef.current.find(t => t.id === taskId)
    if (!task) return
    const state = getTaskState(taskId)
    if (state.status === 'done') return

    const [h, m] = task.time.split(':').map(Number)
    const scheduled = new Date(); scheduled.setHours(h, m, 0, 0)
    const isOnTime = Date.now() <= scheduled.getTime() + 10 * 60 * 1000

    const xp = calcXP(task, state.snoozeCount || 0, isOnTime)
    updateTask(taskId, { status: 'done', xpEarned: xp, doneAt: Date.now() })
    const newTotal = addXP(xp)
    const newStreak = checkAndUpdateStreak()

    haptic(60)
    setTotalXP(newTotal)
    setStreak(newStreak)
    refreshStates()
    setToast({ message: getPraise(), xp })

    if (swReady) {
      const updated = {}
      activeTasksRef.current.forEach(t => { updated[t.id] = getTaskState(t.id) })
      scheduleAll(activeTasksRef.current, updated)
    }
  }, [refreshStates, swReady])

  const handleUndo = useCallback((taskId) => {
    const xpToRemove = undoTask(taskId)
    setTotalXP(subtractXP(xpToRemove))
    refreshStates()
    if (swReady) {
      const updated = {}
      activeTasksRef.current.forEach(t => { updated[t.id] = getTaskState(t.id) })
      scheduleAll(activeTasksRef.current, updated)
    }
  }, [refreshStates, swReady])

  const handleTimeEdit = useCallback((taskId, time) => {
    setCustomTime(taskId, time)
    setCustomTimes(prev => ({ ...prev, [taskId]: time }))
  }, [])

  const handleAddTask = useCallback(({ label, time, emoji, xp }) => {
    const task = addCustomTask({ label, time, emoji, xp })
    setCustomTaskList(prev => [...prev, task])
    setTaskStates(prev => ({ ...prev, [task.id]: getTaskState(task.id) }))
  }, [])

  const handleRemoveTask = useCallback((taskId) => {
    removeCustomTask(taskId)
    setCustomTaskList(prev => prev.filter(t => t.id !== taskId))
  }, [])

  const handleTestNotif = useCallback(() => {
    if (!notifGranted) { alert('Najpierw włącz powiadomienia przyciskiem powyżej.'); return }
    if (!fireTestNotification()) alert('Service Worker nie jest gotowy. Odśwież aplikację.')
  }, [notifGranted])

  useEffect(() => { registerSW().then(reg => { if (reg) setSwReady(true) }) }, [])

  useEffect(() => {
    if (!swReady) return
    const updated = {}
    activeTasks.forEach(t => { updated[t.id] = getTaskState(t.id) })
    scheduleAll(activeTasks, updated)
    const unsub = listenForActions(({ action, taskId }) => {
      if (action === 'done') {
        handleDone(taskId)
      } else if (action === 'snooze') {
        updateTask(taskId, { snoozeCount: (getTaskState(taskId).snoozeCount || 0) + 1 })
        refreshStates()
      }
    })
    return unsub
  }, [swReady, handleDone, refreshStates, activeTasks])

  // Minute ticker — updates relative times in TaskCards
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 60000)
    return () => clearInterval(id)
  }, [])

  // Midnight reset
  useEffect(() => {
    const schedule = () => {
      const now = new Date()
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5)
      const t = setTimeout(() => { refreshStates(); schedule() }, midnight - now)
      return t
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [refreshStates])

  const handleEnableNotifications = async () => {
    const granted = await requestPermission()
    setNotifGranted(granted)
    if (granted && swReady) {
      const updated = {}
      activeTasks.forEach(t => { updated[t.id] = getTaskState(t.id) })
      scheduleAll(activeTasks, updated)
    }
  }

  const done     = activeTasks.filter(t => taskStates[t.id]?.status === 'done').length
  const total    = activeTasks.length
  const allDone  = total > 0 && done === total
  const todayXP  = activeTasks.reduce((s, t) => s + (taskStates[t.id]?.xpEarned || 0), 0)
  const { current } = getLevelInfo(totalXP)

  return (
    <div className="min-h-screen" style={{ background: '#030712' }}>
      <div
        className="max-w-md mx-auto px-4 pt-10 pb-28 space-y-4"
        style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">
              Day<span style={{ color: current.color }}>Forge</span>
            </h1>
            <p className="text-xs text-gray-600 mt-1 capitalize">{formatDate()}</p>
          </div>
          <div
            className="text-xs font-semibold px-3 py-1.5 rounded-xl mt-1"
            style={{ background: '#0d111a', border: '1px solid #1c2430', color: allDone ? '#4ade80' : '#6b7280' }}
          >
            {done}/{total} zadań
          </div>
        </div>

        <XPBar totalXP={totalXP} streak={streak} />

        {tab === 'today' && (
          <>
            {/* Notification banner */}
            {!notifGranted && (
              <button
                onClick={handleEnableNotifications}
                className="w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: '#1a0900',
                  border: '1px solid rgba(234,88,12,0.3)',
                  color: '#fb923c',
                }}
              >
                <span>⌚</span>
                Włącz powiadomienia na Apple Watch
                <span className="text-orange-700 ml-auto">→</span>
              </button>
            )}

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5" style={{ color: '#374151' }}>
                <span>Postęp dnia</span>
                <span style={{ color: allDone ? '#4ade80' : '#4b5563' }}>
                  {total > 0 ? Math.round((done / total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full rounded-full h-1 overflow-hidden" style={{ background: '#0d111a' }}>
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${total > 0 ? (done / total) * 100 : 0}%`,
                    background: current.color,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>

            {/* All done celebration */}
            {allDone && (
              <div
                className="rounded-2xl p-5 text-center"
                style={{
                  background: 'linear-gradient(135deg, #052e16, #14532d)',
                  border: '1px solid rgba(22,163,74,0.3)',
                  animation: 'fadeIn 0.4s ease',
                }}
              >
                <div className="text-3xl mb-1.5">🏆</div>
                <div className="text-lg font-black text-white">Dzień ukończony!</div>
                <div className="text-sm text-green-400 mt-0.5">Wszystkie {total} zadania wykonane</div>
                <div className="text-xs text-green-700 mt-1">+{todayXP} XP zdobyte dzisiaj</div>
              </div>
            )}

            {/* Task list */}
            <div className="space-y-2">
              {activeTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  state={taskStates[task.id] || {}}
                  onDone={handleDone}
                  onUndo={handleUndo}
                  onTimeEdit={handleTimeEdit}
                  onRemove={task.isCustom ? handleRemoveTask : undefined}
                  isNext={task.id === nextTaskId}
                />
              ))}
            </div>

            <AddTaskForm onAdd={handleAddTask} onTestNow={handleTestNotif} />
            <SleepWidget swReady={swReady} />
          </>
        )}

        {tab === 'history' && <HistoryView />}

        <p className="text-center text-xs pb-2" style={{ color: '#1f2937' }}>
          Dodaj do Home Screen dla powiadomień Watch
          <br />
          <span style={{ color: '#111827' }}>v{__APP_VERSION__}</span>
        </p>
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className="max-w-md mx-auto"
          style={{
            background: 'rgba(3,7,18,0.92)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid #1c2430',
          }}
        >
          <div className="flex">
            {[
              { id: 'today',   icon: '☀️', label: 'Dziś' },
              { id: 'history', icon: '📅', label: 'Historia' },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 relative transition-colors"
                style={{ color: tab === id ? 'white' : '#4b5563' }}
              >
                <span className="text-xl leading-none">{icon}</span>
                <span className="text-xs font-medium">{label}</span>
                {tab === id && (
                  <div
                    className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-t-full"
                    style={{ background: current.color }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {toast && <Toast message={toast.message} xp={toast.xp} onDone={() => setToast(null)} />}
    </div>
  )
}
