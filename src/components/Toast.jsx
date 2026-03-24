import { useEffect, useState } from 'react'

export default function Toast({ message, xp, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={`
      fixed top-6 left-1/2 -translate-x-1/2 z-50
      flex items-center gap-3 px-5 py-3 rounded-2xl
      bg-gray-800 border border-green-500/40 shadow-xl shadow-green-500/10
      transition-all duration-300
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
    `}>
      <span className="text-green-400 text-xl">⚡</span>
      <div>
        <div className="text-white font-bold">{message}</div>
        <div className="text-green-400 text-sm font-semibold">+{xp} XP</div>
      </div>
    </div>
  )
}
