import { useEffect, useState } from 'react'

export default function Toast({ message, xp, onDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Small delay so animation triggers
    const show = setTimeout(() => setVisible(true), 10)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 400)
    }, 2800)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [onDone])

  return (
    <div
      className="fixed bottom-24 left-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl pointer-events-none"
      style={{
        transform: `translateX(-50%) translateY(${visible ? '0' : '20px'})`,
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease',
        background: 'linear-gradient(135deg, #14532d, #166534)',
        border: '1px solid rgba(22,163,74,0.4)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(22,163,74,0.15)',
        whiteSpace: 'nowrap',
      }}
    >
      <span className="text-xl">⚡</span>
      <div>
        <div className="text-white font-bold text-sm">{message}</div>
        <div className="text-green-400 text-xs font-semibold">+{xp} XP zdobyte</div>
      </div>
    </div>
  )
}
