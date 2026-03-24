// DayForge Service Worker

let schedule = []
const timers = new Map()

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('message', event => {
  if (event.data?.type !== 'SCHEDULE') return

  // Clear existing timers
  timers.forEach(id => clearTimeout(id))
  timers.clear()

  schedule = event.data.schedule
  const now = Date.now()

  schedule.forEach(task => {
    const delay = task.fireAt - now
    if (delay < 0) return
    const id = setTimeout(() => fireNotification(task), delay)
    timers.set(task.id, id)
  })
})

function fireNotification(task) {
  return self.registration.showNotification(task.emoji + ' ' + task.label, {
    body: task.message,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'task_' + task.id,
    renotify: true,
    requireInteraction: true,
    data: { taskId: task.id, xp: task.xp, task },
    actions: [
      { action: 'done',    title: '✓ Done' },
      { action: 'snooze5', title: '+5 min' },
      { action: 'snooze30',title: '+30 min' },
      { action: 'snooze60',title: '+1 hour' },
    ],
  })
}

self.addEventListener('notificationclick', event => {
  const { action, notification } = event
  const { taskId, task } = notification.data
  notification.close()

  if (action === 'done' || action === '') {
    event.waitUntil(broadcast({ type: 'TASK_ACTION', action: 'done', taskId }))
  } else {
    const minutes = action === 'snooze5' ? 5 : action === 'snooze30' ? 30 : 60
    event.waitUntil(
      broadcast({ type: 'TASK_ACTION', action: 'snooze', taskId, minutes }).then(() => {
        return new Promise(resolve => {
          const id = setTimeout(() => {
            fireNotification(task)
            resolve()
          }, minutes * 60 * 1000)
          timers.set(taskId + '_snooze', id)
        })
      })
    )
  }
})

async function broadcast(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  clients.forEach(c => c.postMessage(message))
}
