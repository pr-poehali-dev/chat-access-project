import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const adminNotificationSound = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    notificationSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
    adminNotificationSound.current = new Audio('data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0Yc7///8AAAAAAQAAAP7////+/////v////3////+/////f////3////9/////f////3////9/////P////z////8/////P////z////7/////P////v////7/////v////z////+/////P////z///////7////+/////////v////7////+/////v////7///////7////+/////v////7////+/////v////7////+/////v////7////+/////v////7////+/////v////7////9/////v////3////+/////f////7////9/////f////3////+/////f////3////9/////f////3////9/////f////3////9/////f////3////9/////f////3////9/////f////3////8/////f////3////8/////f////z////9/////P////z////8/////P////z////8/////P////z////8/////P////v////8/////P////v////7/////P////v////7/////P////v////7/////P////r////7/////P////v////6/////P////v////6/////P////r////6/////P////r////6/////P////n////6/////P////n////6/////f////n////5/////f////n////5/////v////j////5/////v////n////4/////////j////4////////////4////+P/////////+////9////+////////////z////8/////////f////v////8////////+f////v////7/////P////r////6/////P////r////6/////P////n////6/////P////n////5/////v////n////5/////v////j////5/////v////j////4/////v////j////4/////v////n////+P////7////3////+P////7////3////9/////7////3////9////////////f////b////+////////////9v////3////////////1////+P////3////0////+P////3////0////+P////z////z////+f////z////y////+f////z////y////+f////z////x////+v////z////w////+v////z////v////+/////v////u////+/////v////u////+/////v////t////+/////v////s////+/////r////r////+/////r////q/////P////n////p/////P////n////o/////f////j////o/////f////f////n/////v////f////m/////////v////b////l//////////7////1////5f//////////9P///+T///////////7////0////4/////////////T////i/////////////fP////h/////////////fP////h/////////////PP////g/////////////PP////f/////////////PP////e/////////+z////y////3f////////3s////8v///9v////////+7f///+////////3q////8P///9r///////7u////7////9r///////vu////7v///9j///////7v////7f///9b///////zw////7f///9X////////x////7P///9P////////y////6////9L////////z////6v///9H////////0////6f///9D////////1////6P///8/////////... [truncated]
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

  const showNotification = (message: string, isAdminMessage: boolean = false) => {
    const soundToPlay = isAdminMessage ? adminNotificationSound.current : notificationSound.current;
    
    if (soundToPlay) {
      soundToPlay.volume = isAdminMessage ? 0.7 : 0.5;
      soundToPlay.play().catch((err) => {
        console.log('Sound play failed:', err);
      });
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
      if (document.hidden) {
        new Notification(isAdminMessage ? '👑 Команда юристов ответила' : 'Новое сообщение в чате', {
          body: message.substring(0, 100),
          icon: 'https://cdn.poehali.dev/projects/0c6e7a17-cb77-4211-87f3-c9e0e456ee77/files/9408ffb6-d620-48c1-a73c-28f51c620a12.jpg',
          tag: 'chat-message',
          requireInteraction: false,
          vibrate: isAdminMessage ? [200, 100, 200, 100, 200] : [200, 100, 200]
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