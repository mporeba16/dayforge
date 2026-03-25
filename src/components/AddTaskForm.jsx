import { useState } from 'react'

const EMOJIS = ['🎯', '💪', '📚', '🏃', '🧘', '☕', '🎮', '🛒', '📞', '✏️', '🔔', '⚡']
const XP_OPTIONS = [10, 20, 30, 50]

export default function AddTaskForm({ onAdd, onTestNow }) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [time, setTime] = useState(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() + 2)
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(Math.ceil(d.getMinutes() / 5) * 5 % 60).padStart(2, '0')
    return `${h}:${m}`
  })
  const [emoji, setEmoji] = useState('🎯')
  const [xp, setXp] = useState(20)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!label.trim() || !time) return
    onAdd({ label: label.trim(), time, emoji, xp })
    setLabel('')
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      {/* Test notification */}
      <button
        onClick={onTestNow}
        className="w-full py-2.5 rounded-2xl text-sm font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        style={{
          background: '#1a0f00',
          border: '1px solid rgba(234,88,12,0.25)',
          color: '#fb923c',
        }}
      >
        <span>🔔</span>
        Wyślij testowe powiadomienie TERAZ
      </button>

      {/* Add task */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full py-3 rounded-2xl text-sm font-medium transition-all text-gray-600 hover:text-gray-400 flex items-center justify-center gap-2"
          style={{ border: '1px dashed #1c2430' }}
        >
          <span className="text-base leading-none">+</span>
          Dodaj własne zadanie
        </button>
      ) : (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: '#0d111a', border: '1px solid #1c2430', animation: 'fadeIn 0.2s ease' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white text-sm">Nowe zadanie</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/5 text-lg leading-none transition-colors"
            >×</button>
          </div>

          {/* Emoji picker */}
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all"
                style={{
                  background: emoji === e ? '#ea580c' : '#ffffff08',
                  border: emoji === e ? '1px solid transparent' : '1px solid #1c2430',
                  transform: emoji === e ? 'scale(1.1)' : 'scale(1)',
                }}
              >{e}</button>
            ))}
          </div>

          {/* Label */}
          <input
            type="text"
            placeholder="Nazwa zadania..."
            value={label}
            onChange={e => setLabel(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none"
            style={{ background: '#ffffff08', border: '1px solid #1c2430' }}
            autoFocus
            maxLength={40}
            onFocus={e => e.target.style.borderColor = '#ea580c'}
            onBlur={e => e.target.style.borderColor = '#1c2430'}
          />

          {/* Time + XP row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-gray-600 flex-shrink-0">Godz:</span>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="flex-1 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                style={{ background: '#ffffff08', border: '1px solid #1c2430' }}
                required
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-600">XP:</span>
              <div className="flex gap-1">
                {XP_OPTIONS.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setXp(v)}
                    className="px-2 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    style={{
                      background: xp === v ? '#854d0e' : '#ffffff08',
                      color: xp === v ? '#fde68a' : '#6b7280',
                      border: xp === v ? '1px solid #a16207' : '1px solid transparent',
                    }}
                  >{v}</button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!label.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{
              background: label.trim() ? 'linear-gradient(135deg, #c2410c, #ea580c)' : '#ffffff08',
              color: label.trim() ? 'white' : '#4b5563',
            }}
          >
            Dodaj i zaplanuj powiadomienie
          </button>
        </div>
      )}
    </div>
  )
}
