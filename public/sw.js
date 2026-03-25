// DayForge Service Worker

let schedule = []
const timers = new Map()
let sleepTimerId = null

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('message', event => {
  const msg = event.data
  if (!msg) return

  if (msg.type === 'SCHEDULE') {
    // Clear only task timers, not sleep alarm
    timers.forEach(id => clearTimeout(id))
    timers.clear()

    schedule = msg.schedule
    const now = Date.now()

    schedule.forEach(task => {
      const delay = task.fireAt - now
      if (delay < 0) return
      const id = setTimeout(() => fireNotification(task), delay)
      timers.set(task.id, id)
    })
  }

  if (msg.type === 'TEST_NOTIFICATION') {
    self.registration.showNotification('🔔 DayForge — Test', {
      body: 'Powiadomienia działają! Widzisz to na Watch? ✓',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'test_notif',
      renotify: true,
      requireInteraction: true,
      data: { taskId: null },
      actions: [{ action: 'done', title: '✓ Działa!' }],
    })
  }

  if (msg.type === 'SLEEP_ALARM') {
    if (sleepTimerId !== null) {
      clearTimeout(sleepTimerId)
      sleepTimerId = null
    }
    const delay = msg.fireAt - Date.now()
    if (delay <= 0) return
    sleepTimerId = setTimeout(() => fireSleepAlarm(), delay)
  }
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

function fireSleepAlarm() {
  sleepTimerId = null
  const task = {
    id: 'wake',
    label: 'Wake Up',
    emoji: '🌅',
    message: '7 godzin snu za tobą. Czas wstawać!',
    xp: 20,
  }
  return self.registration.showNotification('🌅 Wake Up!', {
    body: task.message,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'task_wake',
    renotify: true,
    requireInteraction: true,
    data: { taskId: 'wake', xp: 20, task },
    actions: [
      { action: 'done',    title: '✓ Done' },
      { action: 'snooze5', title: '+5 min' },
      { action: 'snooze30',title: '+30 min' },
    ],
  })
}

self.addEventListener('notificationclick', event => {
  const { action, notification } = event
  const { taskId, task } = notification.data
  notification.close()

  if (!taskId) return // test notification

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
