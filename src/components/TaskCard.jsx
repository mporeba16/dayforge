import { useState } from 'react'
import { calcXP } from '../lib/xp'

function getRelativeTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const taskTime = new Date()
  taskTime.setHours(h, m, 0, 0)
  const diffMin = Math.round((taskTime - Date.now()) / 60000)

  if (Math.abs(diffMin) <= 5)  return { label: 'teraz!',           color: '#f59e0b', pulse: true }
  if (diffMin > 0 && diffMin < 15) return { label: `za ${diffMin}min`,      color: '#fb923c', pulse: false }
  if (diffMin >= 15 && diffMin < 60) return { label: `za ${diffMin}min`,    color: '#6b7280', pulse: false }
  if (diffMin >= 60)            return { label: `za ${Math.round(diffMin / 60)}h`, color: '#6b7280', pulse: false }
  if (diffMin < 0 && diffMin > -60) return { label: `${-diffMin}min temu`,  color: '#f59e0b', pulse: false }
  return { label: `${Math.round(-diffMin / 60)}h temu`,             color: '#4b5563', pulse: false }
}

export default function TaskCard({ task, state, onDone, onUndo, onTimeEdit, onRemove, isNext }) {
  const { status = 'pending', snoozeCount = 0, xpEarned = 0 } = state
  const [editingTime, setEditingTime] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isDone = status === 'done'
  const rel    = getRelativeTime(task.time)

  const [taskH, taskM] = task.time.split(':').map(Number)
  const taskDate = new Date(); taskDate.setHours(taskH, taskM, 0, 0)
  const isPast   = new Date() > taskDate
  const previewXP = calcXP(task, snoozeCount, !isPast)

  const handleTimeBlur = (e) => {
    const val = e.target.value
    if (val) onTimeEdit(task.id, val)
    setEditingTime(false)
  }
  const handleTimeKeyDown = (e) => {
    if (e.key === 'Enter')  { if (e.target.value) onTimeEdit(task.id, e.target.value); setEditingTime(false) }
    if (e.key === 'Escape') setEditingTime(false)
  }

  return (
    <div
      className="relative rounded-2xl p-4 flex items-center gap-3 transition-all duration-300 overflow-hidden"
      style={{
        background: isDone
          ? '#1e293b'
          : isNext
          ? 'linear-gradient(to bottom, #2d1500, #1e293b)'
          : '#1e293b',
        border: isDone
          ? '1px solid #334155'
          : isNext
          ? '1px solid rgba(249,115,22,0.5)'
          : '1px solid #334155',
        opacity: isDone ? 0.5 : 1,
        boxShadow: isNext ? '0 -2px 12px rgba(249,115,22,0.15), 0 4px 16px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Top accent glow for next task */}
      {isNext && !isDone && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500"
             style={{ boxShadow: '0 0 8px rgba(249,115,22,0.8)' }} />
      )}

      {/* Emoji circle */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{
          background: isDone ? '#ffffff0a' : isNext ? '#f9731620' : '#ffffff10',
        }}
      >
        {isDone ? '✓' : task.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-semibold text-[15px] leading-tight ${isDone ? 'line-through text-gray-600' : 'text-white'}`}>
            {task.label}
          </span>
          {isNext && !isDone && (
            <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full">
              następne
            </span>
          )}
          {snoozeCount > 0 && !isDone && (
            <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
              snooze ×{snoozeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Time — editable */}
          {editingTime ? (
            <input
              type="time"
              defaultValue={task.time}
              className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1 border border-orange-500 focus:outline-none w-24"
              autoFocus
              onBlur={handleTimeBlur}
              onKeyDown={handleTimeKeyDown}
            />
          ) : (
            <button
              onClick={() => !isDone && setEditingTime(true)}
              className={`flex items-center gap-1 group text-xs ${isDone ? 'cursor-default text-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
              title={isDone ? undefined : 'Edytuj godzinę'}
            >
              {task.time}
              {!isDone && (
                <span className="text-gray-800 group-hover:text-gray-600 transition-colors">✏</span>
              )}
            </button>
          )}

          {/* Relative time chip */}
          {!isDone && !editingTime && (
            <span
              className="text-xs font-medium"
              style={{ color: rel.color, animation: rel.pulse ? 'none' : undefined }}
            >
              {rel.pulse ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
                  {rel.label}
                </span>
              ) : rel.label}
            </span>
          )}

          {/* XP */}
          {!isDone && (
            <span className="text-xs text-yellow-600/80">+{previewXP} XP</span>
          )}
          {isDone && xpEarned > 0 && (
            <span className="text-xs text-green-600">+{xpEarned} XP</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {onRemove && !isDone && (
          confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1.5 rounded-lg bg-gray-800 text-gray-500 text-xs hover:text-gray-300 transition-colors"
              >Nie</button>
              <button
                onClick={() => onRemove(task.id)}
                className="px-2 py-1.5 rounded-lg bg-red-900/50 text-red-400 text-xs font-semibold hover:bg-red-900 transition-colors"
              >Usuń</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-900/20 text-xs transition-colors"
              title="Usuń"
            >✕</button>
          )
        )}
        {!isDone ? (
          <button
            onClick={() => onDone(task.id)}
            className="px-4 py-2 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
            style={{
              background: isNext
                ? 'linear-gradient(135deg, #ea580c, #f97316)'
                : '#15803d',
              boxShadow: isNext ? '0 0 12px rgba(249,115,22,0.3)' : 'none',
            }}
          >
            Done
          </button>
        ) : (
          <button
            onClick={() => onUndo(task.id)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-800/50 text-gray-600 hover:text-gray-400 text-sm transition-colors"
            title="Cofnij"
          >↩</button>
        )}
      </div>
    </div>
  )
}
