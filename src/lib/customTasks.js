const KEY = 'df_custom_tasks'

export function getCustomTasks() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function addCustomTask({ label, time, emoji, xp = 20 }) {
  const tasks = getCustomTasks()
  const task = {
    id: 'custom_' + Date.now(),
    label,
    time,
    emoji: emoji || '🎯',
    xp,
    message: `Czas na: ${label}!`,
    isCustom: true,
  }
  tasks.push(task)
  localStorage.setItem(KEY, JSON.stringify(tasks))
  return task
}

export function removeCustomTask(taskId) {
  const tasks = getCustomTasks().filter(t => t.id !== taskId)
  localStorage.setItem(KEY, JSON.stringify(tasks))
}
