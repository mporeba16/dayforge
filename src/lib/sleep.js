const KEY = 'df_sleep'

export function getSleepData() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null')
  } catch {
    return null
  }
}

export function recordSleep() {
  const sleepAt = Date.now()
  const wakeAt = sleepAt + 7 * 60 * 60 * 1000
  const data = { sleepAt, wakeAt }
  localStorage.setItem(KEY, JSON.stringify(data))
  return data
}

export function clearSleep() {
  localStorage.removeItem(KEY)
}

export function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}
