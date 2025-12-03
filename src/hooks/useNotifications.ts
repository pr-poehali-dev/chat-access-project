import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    notificationSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast({
          title: 'Уведомления включены',
          description: 'Теперь вы будете получать уведомления о новых сообщениях'
        });
      }
    }
  };

  const showNotification = (message: string) => {
    if (notificationSound.current) {
      notificationSound.current.volume = 0.5;
      notificationSound.current.play().catch((err) => {
        console.log('Sound play failed:', err);
      });
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
      if (document.hidden) {
        new Notification('Новое сообщение в чате', {
          body: message.substring(0, 100),
          icon: 'https://cdn.poehali.dev/projects/0c6e7a17-cb77-4211-87f3-c9e0e456ee77/files/9408ffb6-d620-48c1-a73c-28f51c620a12.jpg',
          tag: 'chat-message',
          requireInteraction: false,
          vibrate: [200, 100, 200]
        });
      }
    }
  };

  return {
    notificationPermission,
    requestNotificationPermission,
    showNotification
  };
}