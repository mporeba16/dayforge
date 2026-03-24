export async function requestPermission() {
  if (!('Notification' in window)) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    return reg
  } catch (e) {
    console.error('SW registration failed:', e)
    return null
  }
}

export function scheduleAll(tasks, todayState) {
  const ctrl = navigator.serviceWorker?.controller
  if (!ctrl) return

  const now = Date.now()
  const schedule = tasks
    .filter(t => {
      const s = todayState[t.id]
      return !s || s.status === 'pending'
    })
    .map(t => {
      const [h, m] = t.time.split(':').map(Number)
      const d = new Date()
      d.setHours(h, m, 0, 0)
      return { ...t, fireAt: d.getTime() }
    })
    .filter(t => t.fireAt > now)

  ctrl.postMessage({ type: 'SCHEDULE', schedule })
}

export function listenForActions(callback) {
  if (!('serviceWorker' in navigator)) return () => {}
  const handler = e => {
    if (e.data?.type === 'TASK_ACTION') callback(e.data)
  }
  navigator.serviceWorker.addEventListener('message', handler)
  return () => navigator.serviceWorker.removeEventListener('message', handler)
}
