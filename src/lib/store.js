const todayKey = () => `df_day_${new Date().toISOString().slice(0, 10)}`
const TOTAL_XP_KEY = 'df_total_xp'
const STREAK_KEY = 'df_streak'

export function getTodayState() {
  try {
    return JSON.parse(localStorage.getItem(todayKey()) || '{}')
  } catch {
    return {}
  }
}

export function getTaskState(taskId) {
  return getTodayState()[taskId] || { status: 'pending', snoozeCount: 0, xpEarned: 0 }
}

export function updateTask(taskId, updates) {
  const state = getTodayState()
  state[taskId] = { ...state[taskId], ...updates }
  localStorage.setItem(todayKey(), JSON.stringify(state))
}

export function getTotalXP() {
  return parseInt(localStorage.getItem(TOTAL_XP_KEY) || '0', 10)
}

export function addXP(amount) {
  const next = getTotalXP() + amount
  localStorage.setItem(TOTAL_XP_KEY, String(next))
  return next
}

export function subtractXP(amount) {
  const next = Math.max(0, getTotalXP() - amount)
  localStorage.setItem(TOTAL_XP_KEY, String(next))
  return next
}

export function undoTask(taskId) {
  const state = getTodayState()
  const xpEarned = state[taskId]?.xpEarned || 0
  state[taskId] = { status: 'pending', snoozeCount: 0, xpEarned: 0 }
  localStorage.setItem(todayKey(), JSON.stringify(state))
  return xpEarned
}

export function getStreak() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"count":0,"lastDate":null}')
  } catch {
    return { count: 0, lastDate: null }
  }
}

export function checkAndUpdateStreak() {
  const streak = getStreak()
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (streak.lastDate === today) return streak
  const count = streak.lastDate === yesterday ? streak.count + 1 : 1
  const updated = { count, lastDate: today }
  localStorage.setItem(STREAK_KEY, JSON.stringify(updated))
  return updated
}
