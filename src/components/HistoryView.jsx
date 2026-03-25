import { useMemo } from 'react'
import { getHistory } from '../lib/history'

function getWeeklyStats() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    try {
      const state = JSON.parse(localStorage.getItem(`df_day_${date}`) || '{}')
      const xp = Object.values(state).reduce((sum, t) => sum + (t.xpEarned || 0), 0)
      const done = Object.values(state).filter(t => t.status === 'done').length
      days.push({ date, xp, done, isToday: i === 0, label: dayLabel(d, i) })
    } catch {
      days.push({ date, xp: 0, done: 0, isToday: i === 0, label: dayLabel(d, i) })
    }
  }
  return days
}

function dayLabel(d, daysAgo) {
  if (daysAgo === 0) return 'Dziś'
  if (daysAgo === 1) return 'Wcz'
  return d.toLocaleDateString('pl-PL', { weekday: 'short' }).replace('.', '')
}

export default function HistoryView() {
  const weekly = useMemo(() => getWeeklyStats(), [])
  const history = useMemo(() => getHistory(), [])

  const maxXP = Math.max(...weekly.map(d => d.xp), 1)
  const totalWeekXP = weekly.reduce((s, d) => s + d.xp, 0)

  return (
    <div className="space-y-5">
      {/* Weekly bar chart */}
      <div className="rounded-xl p-4 bg-slate-800 border border-slate-700">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-sm font-semibold text-white">Ostatnie 7 dni</span>
          <span className="text-xs text-gray-500">+{totalWeekXP} XP łącznie</span>
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {weekly.map(day => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
                <div
                  className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${day.xp > 0 ? Math.max((day.xp / maxXP) * 48, 4) : 2}px`,
                    background: day.isToday
                      ? '#f59e0b'
                      : day.xp > 0
                      ? '#10b981'
                      : '#334155',
                    opacity: day.isToday ? 1 : 0.7,
                  }}
                />
              </div>
              <span className={`text-xs ${day.isToday ? 'text-yellow-400 font-semibold' : 'text-gray-600'}`}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
        {totalWeekXP === 0 && (
          <p className="text-xs text-gray-600 text-center mt-2">Brak danych z tego tygodnia</p>
        )}
      </div>

      {/* History list */}
      {history.length === 0 ? (
        <div className="text-center py-10 text-gray-600">
          <div className="text-4xl mb-3">📅</div>
          <div className="font-medium">Brak historii</div>
          <div className="text-sm mt-1 text-gray-700">Wykonaj zadania, aby zobaczyć tu swój postęp.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(day => (
            <div key={day.date} className="rounded-xl p-4 bg-slate-800 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{formatDate(day.date)}</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {day.doneCount}/{day.totalTasks} zadań · +{day.xpEarned} XP
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-xl font-black"
                    style={{ color: completionColor(day.doneCount, day.totalTasks) }}
                  >
                    {day.totalTasks > 0 ? Math.round((day.doneCount / day.totalTasks) * 100) : 0}%
                  </div>
                  {day.doneCount === day.totalTasks && day.totalTasks > 0 && (
                    <div className="text-xs text-green-500">Idealny dzień!</div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-1">
                {Array.from({ length: day.totalTasks }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full"
                    style={{
                      background: i < day.doneCount
                        ? completionColor(day.doneCount, day.totalTasks)
                        : '#334155',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function completionColor(done, total) {
  if (total === 0) return '#6b7280'
  const pct = done / total
  if (pct === 1) return '#10b981'
  if (pct >= 0.75) return '#f59e0b'
  if (pct >= 0.5) return '#3b82f6'
  return '#6b7280'
}
