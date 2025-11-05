const CHAT_API = 'https://functions.poehali.dev/2143f652-3843-436a-923a-7e36c7c4d228';
const ICON_URL = 'https://cdn.poehali.dev/projects/0c6e7a17-cb77-4211-87f3-c9e0e456ee77/files/9408ffb6-d620-48c1-a73c-28f51c620a12.jpg';

let lastMessageId = null;

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
    icon: ICON_URL,
    badge: ICON_URL,
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_MESSAGES') {
    checkNewMessages(event.data.token);
  }
  if (event.data && event.data.type === 'UPDATE_LAST_MESSAGE_ID') {
    lastMessageId = event.data.messageId;
  }
});

async function checkNewMessages(token) {
  if (!token) return;
  
  try {
    const response = await fetch(CHAT_API, {
      headers: { 'X-User-Token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      const messages = data.messages;
      
      if (messages.length > 0) {
        const latestMessage = messages[0];
        
        if (lastMessageId !== null && latestMessage.id > lastMessageId) {
          await self.registration.showNotification('Новое сообщение в чате', {
            body: latestMessage.content.substring(0, 100),
            icon: ICON_URL,
            badge: ICON_URL,
            tag: 'chat-notification',
            requireInteraction: false,
            data: { url: '/?tab=chat' }
          });
        }
        
        lastMessageId = latestMessage.id;
      }
    }
  } catch (error) {
    console.error('Failed to check messages:', error);
  }
}