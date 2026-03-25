import { getLevelInfo } from '../lib/xp'

export default function XPBar({ totalXP, streak }) {
  const { current, next, progress } = getLevelInfo(totalXP)

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: current.bg, border: `1px solid ${current.color}30` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: current.color }}
          >
            Level {current.level}
          </span>
          <h2 className="text-xl font-black text-white mt-0.5">{current.name}</h2>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <div className="text-2xl font-black leading-none" style={{ color: current.color }}>
            {totalXP.toLocaleString('pl-PL')}
            <span className="text-xs font-normal text-gray-500 ml-1">XP</span>
          </div>
          {streak.count > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-full px-2 py-0.5">
              <span className="text-xs">🔥</span>
              <span className="text-xs font-bold text-orange-400">{streak.count} dni z rzędu</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar with shimmer */}
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${current.color}cc, ${current.color}, ${current.color}cc)`,
            backgroundSize: '300% auto',
            animation: progress < 100 ? 'shimmer 2.5s linear infinite' : 'none',
            transition: 'width 0.7s ease',
          }}
        />
      </div>

      {next && (
        <div className="flex justify-between mt-1.5 text-xs">
          <span style={{ color: `${current.color}80` }}>{Math.round(progress)}%</span>
          <span className="text-slate-500">{(next.minXP - totalXP).toLocaleString('pl-PL')} XP → {next.name}</span>
        </div>
      )}
    </div>
  )
}
