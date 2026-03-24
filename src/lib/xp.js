export const LEVELS = [
  { level: 1, name: 'Sleeper',      minXP: 0,    color: '#6b7280', bg: '#1f2937' },
  { level: 2, name: 'Awakening',    minXP: 200,  color: '#10b981', bg: '#064e3b' },
  { level: 3, name: 'Iron Forge',   minXP: 600,  color: '#3b82f6', bg: '#1e3a5f' },
  { level: 4, name: 'Steel Mind',   minXP: 1400, color: '#8b5cf6', bg: '#2e1065' },
  { level: 5, name: 'Day Master',   minXP: 3000, color: '#f59e0b', bg: '#451a03' },
  { level: 6, name: 'Forge Legend', minXP: 6000, color: '#ef4444', bg: '#450a0a' },
]

export function getLevelInfo(totalXP) {
  let currentIdx = 0
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) {
      currentIdx = i
      break
    }
  }
  const current = LEVELS[currentIdx]
  const next = LEVELS[currentIdx + 1] || null
  const progress = next
    ? ((totalXP - current.minXP) / (next.minXP - current.minXP)) * 100
    : 100

  return { current, next, progress: Math.min(progress, 100) }
}

export function calcXP(task, snoozeCount, isOnTime) {
  let xp = task.xp
  if (isOnTime) xp = Math.round(xp * 1.25)
  if (snoozeCount >= 3) xp = Math.round(xp * 0.9)
  return Math.max(xp, 1)
}

export const PRAISE = [
  'Crushed it!',
  'Forge on!',
  'Iron will!',
  'Day forged!',
  'On fire!',
  'Unstoppable!',
  'Steel mode!',
]

export function getPraise() {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)]
}
