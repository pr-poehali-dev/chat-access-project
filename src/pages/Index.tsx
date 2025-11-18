import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import AboutTab from '@/components/AboutTab';
import ChatTab from '@/components/ChatTab';
import SubscriptionTab from '@/components/SubscriptionTab';
import RulesTab from '@/components/RulesTab';
import SupportTab from '@/components/SupportTab';
import AdminPanel from '@/components/AdminPanel';
import AppHeader from '@/components/AppHeader';
import AuthDialogs from '@/components/AuthDialogs';
import InstallDialog from '@/components/InstallDialog';

interface Reaction {
  emoji: string;
  count: number;
}

interface Message {
  id: number;
  content: string;
  image_url?: string | null;
  image_urls?: string[];
  author_name?: string | null;
  created_at: string;
  reply_to?: number | null;
  user_token?: string | null;
  email?: string | null;
  is_pinned?: boolean;
  edited_at?: string | null;
  reactions?: Reaction[];
  user_reactions?: string[];
}

const CHAT_API = 'https://functions.poehali.dev/2143f652-3843-436a-923a-7e36c7c4d228';
const SUB_API = 'https://functions.poehali.dev/957d493f-5bdb-4f6b-9b96-4f755f9d1d9b';

export default function Index() {
  const [activeTab, setActiveTab] = useState('about');
  const [token, setToken] = useState<string | null>(localStorage.getItem('userToken'));
  const [isAdmin, setIsAdmin] = useState<boolean>(localStorage.getItem('isAdmin') === 'true');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [authorName, setAuthorName] = useState<string>(localStorage.getItem('authorName') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  console.log('isAdmin state:', isAdmin, 'localStorage isAdmin:', localStorage.getItem('isAdmin'));

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log('Service Worker registered'))
        .catch((err) => console.error('Service Worker registration failed:', err));
    }

    const hasSeenInstallPrompt = localStorage.getItem('hasSeenInstallPrompt');
    if (!hasSeenInstallPrompt) {
      localStorage.setItem('hasSeenInstallPrompt', 'true');
      setTimeout(() => {
        toast({
          title: '📱 Установите приложение',
          description: 'Добавьте приложение на главный экран для быстрого доступа!',
          duration: 7000,
        });
      }, 3000);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadSubscription();
      if (activeTab === 'chat') {
        loadMessages();
        
        const hasPromptedName = sessionStorage.getItem('hasPromptedNameDialog');
        if (!authorName && !hasPromptedName) {
          setTimeout(() => {
            setShowNameDialog(true);
            sessionStorage.setItem('hasPromptedNameDialog', 'true');
          }, 1000);
        }
      }
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (activeTab === 'chat' && messages.length > 0) {
      const latestId = messages[0].id;
      localStorage.setItem('lastReadMessageId', latestId.toString());
      setUnreadCount(0);
    }
  }, [activeTab, messages]);

  useEffect(() => {
    if (activeTab === 'chat' && token && subscription?.is_active) {
      const interval = setInterval(() => {
        loadMessages(true);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [activeTab, token, subscription?.is_active]);

  useEffect(() => {
    if (token && subscription?.is_active && 'serviceWorker' in navigator) {
      const bgInterval = setInterval(() => {
        navigator.serviceWorker.ready.then(registration => {
          registration.active?.postMessage({
            type: 'CHECK_MESSAGES',
            token: token
          });
        });
      }, 15000);
      
      return () => clearInterval(bgInterval);
    }
  }, [token, subscription?.is_active]);

  const loadSubscription = async () => {
    try {
      const res = await fetch(SUB_API, {
        headers: { 'X-User-Token': token! }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
        const hasAutoSwitched = sessionStorage.getItem('hasAutoSwitchedToChat');
        if (data.is_active && activeTab === 'about' && !hasAutoSwitched) {
          setActiveTab('chat');
          sessionStorage.setItem('hasAutoSwitchedToChat', 'true');
        }
      }
    } catch (error) {
      console.error('Failed to load subscription');
    }
  };

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
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Новое сообщение в чате', {
        body: message.substring(0, 100),
        icon: 'https://cdn.poehali.dev/projects/0c6e7a17-cb77-4211-87f3-c9e0e456ee77/files/9408ffb6-d620-48c1-a73c-28f51c620a12.jpg',
        tag: 'chat-message',
        requireInteraction: false
      });
    }
  };

  const loadMessages = async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoading(true);
    const prevLatestId = messages.length > 0 ? messages[0].id : null;
    const lastReadId = parseInt(localStorage.getItem('lastReadMessageId') || '0');
    
    try {
      const res = await fetch(CHAT_API, {
        headers: { 'X-User-Token': token }
      });
      if (res.ok) {
        const data = await res.json();
        const newMessages = data.messages;
        
        if (silent && prevLatestId !== null && newMessages.length > 0 && newMessages[0].id > prevLatestId) {
          showNotification(newMessages[0].content);
        }
        
        const unread = newMessages.filter((msg: Message) => msg.id > lastReadId).length;
        setUnreadCount(activeTab === 'chat' ? 0 : unread);
        
        setMessages(newMessages);
        
        if (newMessages.length > 0 && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.active?.postMessage({
              type: 'UPDATE_LAST_MESSAGE_ID',
              messageId: newMessages[0].id
            });
          });
        }
      } else if (!silent) {
        toast({
          title: 'Ошибка доступа',
          description: 'Проверьте статус подписки',
          variant: 'destructive'
        });
      }
    } catch (error) {
      if (!silent) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить сообщения',
          variant: 'destructive'
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const sendMessage = async (replyTo?: number, imageUrls?: string[]) => {
    if ((!newMessage.trim() && (!imageUrls || imageUrls.length === 0)) || !token) return;
    setIsLoading(true);
    try {
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token
        },
        body: JSON.stringify({ 
          content: newMessage,
          image_urls: imageUrls || [],
          author_name: authorName || null,
          reply_to: replyTo || null
        })
      });
      if (res.ok) {
        setNewMessage('');
        await loadMessages();
        toast({
          title: 'Сообщение отправлено'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: 'Проверьте статус подписки',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка отправки',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('isAdmin');
    setToken(null);
    setIsAdmin(false);
    setActiveTab('about');
    toast({
      title: 'Выход выполнен',
      description: 'Вы вышли из аккаунта'
    });
  };

  const handleAdminLogin = (adminToken: string) => {
    setToken(adminToken);
    setIsAdmin(true);
  };

  const handleTokenLogin = (userToken: string) => {
    setToken(userToken);
  };

  const deleteMessage = async (messageId: number) => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch(`${CHAT_API}?id=${messageId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Token': token
        }
      });
      if (res.ok) {
        await loadMessages();
        toast({
          title: 'Сообщение удалено'
        });
      } else {
        toast({
          title: 'Ошибка удаления',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка удаления',
        variant: 'destructive'
      });
    }
  };

  const togglePinMessage = async (messageId: number, isPinned: boolean) => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch(`${CHAT_API}?id=${messageId}&action=pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token
        },
        body: JSON.stringify({ is_pinned: !isPinned })
      });
      if (res.ok) {
        await loadMessages();
        toast({
          title: isPinned ? 'Сообщение откреплено' : 'Сообщение закреплено'
        });
      } else {
        toast({
          title: 'Ошибка',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        variant: 'destructive'
      });
    }
  };

  const editMessage = async (messageId: number, newContent: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${CHAT_API}?id=${messageId}&action=edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token
        },
        body: JSON.stringify({ content: newContent })
      });
      if (res.ok) {
        await loadMessages();
        toast({
          title: 'Сообщение отредактировано'
        });
      } else {
        const data = await res.json();
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отредактировать',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка редактирования',
        variant: 'destructive'
      });
    }
  };

  const toggleReaction = async (messageId: number, emoji: string, hasReacted: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`${CHAT_API}?id=${messageId}&action=reaction`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token
        },
        body: JSON.stringify({ emoji, remove: hasReacted })
      });
      if (res.ok) {
        await loadMessages();
      }
    } catch (error) {
      console.error('Failed to toggle reaction');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        token={token}
        isAdmin={isAdmin}
        subscription={subscription}
        authorName={authorName}
        onTokenDialogOpen={() => setShowTokenDialog(true)}
        onAdminDialogOpen={() => setShowAdminDialog(true)}
        onNameDialogOpen={() => setShowNameDialog(true)}
        onInstallDialogOpen={() => setShowInstallDialog(true)}
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full h-auto ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="about" className="flex-col gap-1 py-2 px-1">
              <Icon name="Info" size={18} />
              <span className="text-xs">О курсе</span>
            </TabsTrigger>
            <TabsTrigger value="chat" disabled={!token || (!subscription?.is_active && !isAdmin)} className="flex-col gap-1 py-2 px-1 relative">
              <Icon name="MessageSquare" size={18} />
              <span className="text-xs">Чат</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex-col gap-1 py-2 px-1">
              <Icon name="CreditCard" size={18} />
              <span className="text-xs">Тарифы</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex-col gap-1 py-2 px-1">
              <Icon name="FileText" size={18} />
              <span className="text-xs">Правила</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex-col gap-1 py-2 px-1">
              <Icon name="HeadphonesIcon" size={18} />
              <span className="text-xs">Помощь</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex-col gap-1 py-2 px-1">
                <Icon name="Shield" size={18} />
                <span className="text-xs">Админ</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <AboutTab />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <ChatTab
              messages={messages}
              newMessage={newMessage}
              isLoading={isLoading}
              notificationPermission={notificationPermission}
              isAdmin={isAdmin}
              currentUserToken={token}
              onMessageChange={setNewMessage}
              onSendMessage={sendMessage}
              onRequestNotifications={requestNotificationPermission}
              onDeleteMessage={deleteMessage}
              onTogglePinMessage={togglePinMessage}
              onEditMessage={editMessage}
              onToggleReaction={toggleReaction}
            />
          </TabsContent>

          <TabsContent value="subscription" className="mt-6">
            <SubscriptionTab
              subscription={subscription}
            />
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <RulesTab />
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <SupportTab />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="mt-6">
              <AdminPanel token={token!} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <InstallDialog
        open={showInstallDialog}
        onOpenChange={setShowInstallDialog}
      />

      <AuthDialogs
        showAdminDialog={showAdminDialog}
        showTokenDialog={showTokenDialog}
        showNameDialog={showNameDialog}
        onAdminDialogChange={setShowAdminDialog}
        onTokenDialogChange={setShowTokenDialog}
        onNameDialogChange={setShowNameDialog}
        onAdminLogin={handleAdminLogin}
        onTokenLogin={handleTokenLogin}
        onNameSave={setAuthorName}
        authorName={authorName}
      />
    </div>
  );
}