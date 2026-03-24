import { getLevelInfo } from '../lib/xp'

export default function XPBar({ totalXP, streak }) {
  const { current, next, progress } = getLevelInfo(totalXP)

  return (
    <div className="rounded-2xl p-4" style={{ background: current.bg, border: `1px solid ${current.color}33` }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: current.color }}>
            Level {current.level}
          </span>
          <h2 className="text-xl font-bold text-white">{current.name}</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black" style={{ color: current.color }}>
            {totalXP} <span className="text-sm font-normal text-gray-400">XP</span>
          </div>
          {streak.count > 0 && (
            <div className="text-sm text-orange-400 font-semibold">
              🔥 {streak.count} day streak
            </div>
          )}
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, background: current.color }}
        />
      </div>

      {next && (
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{current.name}</span>
          <span>{next.minXP - totalXP} XP to {next.name}</span>
        </div>
      )}
    </div>
  )
}
