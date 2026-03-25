import { useState } from 'react'
import { getSleepData, recordSleep, clearSleep, fmtTime } from '../lib/sleep'
import { scheduleSleepAlarm } from '../lib/notifications'

export default function SleepWidget({ swReady }) {
  const [sleep, setSleep] = useState(getSleepData)

  const handleSleep = () => {
    const data = recordSleep()
    setSleep(data)
    if (swReady) scheduleSleepAlarm(data.wakeAt)
  }

  const handleCancel = () => {
    clearSleep()
    setSleep(null)
    if (swReady) scheduleSleepAlarm(0)
  }

  if (sleep) {
    return (
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #0c0a1e, #13111f)',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
               style={{ background: 'rgba(139,92,246,0.15)' }}>
            🌙
          </div>
          <div>
            <div className="text-xs text-violet-400 font-semibold mb-0.5">Tryb snu aktywny</div>
            <div className="text-white font-bold">
              Budzik o <span className="text-violet-300">{fmtTime(sleep.wakeAt)}</span>
            </div>
            <div className="text-xs text-gray-600 mt-0.5">Zasłeś o {fmtTime(sleep.sleepAt)}</div>
          </div>
        </div>
        <button
          onClick={handleCancel}
          className="text-xs text-gray-600 hover:text-gray-400 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          Anuluj
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSleep}
      className="w-full py-3.5 rounded-2xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 text-sm"
      style={{
        background: 'linear-gradient(135deg, #0c0a1e, #13111f)',
        border: '1px solid rgba(139,92,246,0.2)',
        color: '#a78bfa',
      }}
    >
      <span className="text-base">🌙</span>
      Idę spać — budzik za 7h
    </button>
  )
}
