self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Новое сообщение';
  const options = {
    body: data.body || 'У вас новое сообщение в чате',
    icon: 'https://cdn.poehali.dev/projects/0c6e7a17-cb77-4211-87f3-c9e0e456ee77/files/ec56d354-a0c1-45ae-ad47-5e168cf62891.jpg',
    badge: 'https://cdn.poehali.dev/projects/0c6e7a17-cb77-4211-87f3-c9e0e456ee77/files/ec56d354-a0c1-45ae-ad47-5e168cf62891.jpg',
    tag: 'chat-notification',
    requireInteraction: false,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
