self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const notif = payload.notification || {};
  const customData = payload.data || {};
  const title = notif.title || payload.title || 'AMRIT PRASARAN · Breaking & E-Paper Alert';
  const targetUrl = customData.url || payload.url || '/epaper';

  const options = {
    body: notif.body || payload.body || 'New edition or breaking J&K news is available to read.',
    icon: notif.icon || payload.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: customData.tag || payload.tag || 'amrit-prasaran-alert',
    data: {
      url: targetUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/epaper';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return client;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
