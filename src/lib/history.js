export function getHistory() {
  const today = new Date().toISOString().slice(0, 10)
  const days = []

  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith('df_day_')) continue
    const date = key.replace('df_day_', '')
    if (date === today) continue

    try {
      const state = JSON.parse(localStorage.getItem(key))
      const taskList = Object.values(state)
      const doneCount = taskList.filter(t => t.status === 'done').length
      const xpEarned = taskList.reduce((sum, t) => sum + (t.xpEarned || 0), 0)
      days.push({ date, doneCount, totalTasks: taskList.length, xpEarned })
    } catch {
      // skip corrupt entries
    }
  }

  return days.sort((a, b) => b.date.localeCompare(a.date))
}
