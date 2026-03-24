import { calcXP } from '../lib/xp'

export default function TaskCard({ task, state, onDone, onUndo }) {
  const { status = 'pending', snoozeCount = 0, xpEarned = 0 } = state

  const isDone = status === 'done'
  const isNext = status === 'next'

  const [taskH, taskM] = task.time.split(':').map(Number)
  const now = new Date()
  const taskDate = new Date()
  taskDate.setHours(taskH, taskM, 0, 0)
  const isPast = now > taskDate
  const previewXP = calcXP(task, snoozeCount, !isPast)

  return (
    <div
      className={`
        relative rounded-xl p-4 flex items-center gap-4 transition-all duration-300
        ${isDone
          ? 'bg-gray-900 border border-gray-800 opacity-60'
          : isNext
          ? 'bg-gray-800 border border-orange-500/50 shadow-lg shadow-orange-500/10'
          : 'bg-gray-900 border border-gray-800'
        }
      `}
    >
      {/* Status indicator */}
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0
        ${isDone ? 'bg-green-900/40' : 'bg-gray-800'}
      `}>
        {isDone ? '✓' : task.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isDone ? 'line-through text-gray-500' : 'text-white'}`}>
            {task.label}
          </span>
          {snoozeCount > 0 && !isDone && (
            <span className="text-xs text-orange-400 bg-orange-900/30 px-1.5 py-0.5 rounded-full">
              snoozed ×{snoozeCount}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
          <span>{task.time}</span>
          {!isDone && (
            <span className="text-yellow-500/80">+{previewXP} XP</span>
          )}
          {isDone && xpEarned > 0 && (
            <span className="text-green-500">+{xpEarned} XP earned</span>
          )}
        </div>
      </div>

      {/* Action */}
      {!isDone ? (
        <button
          onClick={() => onDone(task.id)}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
        >
          Done
        </button>
      ) : (
        <button
          onClick={() => onUndo(task.id)}
          className="flex-shrink-0 px-2 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-500 hover:text-gray-300 text-xs transition-colors"
          title="Undo"
        >
          ↩
        </button>
      )}
    </div>
  )
}
