const KEY = 'df_custom_times'

export function getCustomTimes() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function setCustomTime(taskId, time) {
  const times = getCustomTimes()
  times[taskId] = time
  localStorage.setItem(KEY, JSON.stringify(times))
}
