import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import AboutTab from '@/components/AboutTab';
import ChatTab from '@/components/ChatTab';
import SubscriptionTab from '@/components/SubscriptionTab';
import RulesTab from '@/components/RulesTab';
import SupportTab from '@/components/SupportTab';
import AdminPanel from '@/components/AdminPanel';

interface Message {
  id: number;
  content: string;
  created_at: string;
  reply_to?: number | null;
  user_token?: string | null;
  email?: string | null;
}

const CHAT_API = 'https://functions.poehali.dev/2143f652-3843-436a-923a-7e36c7c4d228';
const SUB_API = 'https://functions.poehali.dev/957d493f-5bdb-4f6b-9b96-4f755f9d1d9b';

export default function Index() {
  const [activeTab, setActiveTab] = useState('about');
  const [token, setToken] = useState<string | null>(localStorage.getItem('userToken'));
  const [isAdmin, setIsAdmin] = useState<boolean>(localStorage.getItem('isAdmin') === 'true');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
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
      }
    }
  }, [token, activeTab]);

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



  const sendMessage = async (replyTo?: number) => {
    if (!newMessage.trim() || !token) return;
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
          reply_to: replyTo || null
        })
      });
      if (res.ok) {
        setNewMessage('');
        loadMessages();
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="MessageSquare" size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Банкротство физ. лиц</h1>
              <p className="text-xs text-muted-foreground">Закрытое сообщество курса Валентины Голосовой</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!token && (
              <Button 
                onClick={() => setShowAdminDialog(true)}
                variant="outline"
                className="gap-2"
                size="sm"
              >
                <Icon name="Key" size={16} />
                Админ-доступ
              </Button>
            )}
            {isAdmin && (
              <>
                <Badge variant="default" className="gap-2">
                  <Icon name="Shield" size={14} />
                  Администратор
                </Badge>
                <Button 
                  onClick={() => {
                    localStorage.removeItem('userToken');
                    localStorage.removeItem('isAdmin');
                    setToken(null);
                    setIsAdmin(false);
                    setActiveTab('about');
                    toast({
                      title: 'Выход выполнен',
                      description: 'Вы вышли из админ-панели'
                    });
                  }}
                  variant="outline"
                  className="gap-2"
                  size="sm"
                >
                  <Icon name="LogOut" size={16} />
                  Выйти
                </Button>
              </>
            )}
            <Button 
              onClick={() => setShowInstallDialog(true)}
              className="gap-2"
              size="sm"
            >
              <Icon name="Smartphone" size={16} />
              Скачать приложение
            </Button>
            {subscription?.is_active && !isAdmin && (
              <Badge variant="outline" className="gap-2 border-secondary text-secondary-foreground bg-secondary/10">
                <Icon name="CheckCircle" size={14} />
                Активна до {new Date(subscription.expires_at).toLocaleDateString('ru-RU')}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full h-auto ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="about" className="flex-col gap-1 py-2 px-1">
              <Icon name="Info" size={18} />
              <span className="text-xs">О курсе</span>
            </TabsTrigger>
            <TabsTrigger value="chat" disabled={!token || (!subscription?.is_active && !isAdmin)} className="flex-col gap-1 py-2 px-1">
              <Icon name="MessageSquare" size={18} />
              <span className="text-xs">Чат</span>
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
              onMessageChange={setNewMessage}
              onSendMessage={sendMessage}
              onRequestNotifications={requestNotificationPermission}
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

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Icon name="Smartphone" size={24} className="text-primary" />
              Установите приложение на телефон
            </DialogTitle>
            <DialogDescription>
              Установите приложение для быстрого доступа и работы офлайн
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Icon name="Apple" size={20} className="text-foreground" />
                Для iPhone (iOS):
              </h4>
              <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground pl-2">
                <li>Откройте этот сайт в браузере <strong className="text-foreground">Safari</strong></li>
                <li>Нажмите кнопку <strong className="text-foreground">"Поделиться"</strong> <Icon name="Share" size={14} className="inline" /> (внизу экрана)</li>
                <li>Прокрутите вниз и выберите <strong className="text-foreground">"На экран «Домой»"</strong></li>
                <li>Нажмите <strong className="text-foreground">"Добавить"</strong> — готово! 🎉</li>
              </ol>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Icon name="Smartphone" size={20} className="text-foreground" />
                Для Android:
              </h4>
              <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground pl-2">
                <li>Откройте этот сайт в <strong className="text-foreground">Chrome</strong></li>
                <li>Нажмите меню <strong className="text-foreground">⋮</strong> (три точки в правом верхнем углу)</li>
                <li>Выберите <strong className="text-foreground">"Установить приложение"</strong> или <strong className="text-foreground">"Добавить на главный экран"</strong></li>
                <li>Подтвердите установку — готово! 🎉</li>
              </ol>
            </div>

            <Card className="p-4 bg-primary/10 border-primary/20">
              <div className="flex items-start gap-3">
                <Icon name="Zap" size={20} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-2">Преимущества установки:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Быстрый доступ с главного экрана</li>
                    <li>✓ Работает без интернета</li>
                    <li>✓ Push-уведомления о новых сообщениях</li>
                    <li>✓ Полноэкранный режим без браузерных элементов</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="ShieldCheck" size={24} className="text-primary" />
              Админ-доступ
            </DialogTitle>
            <DialogDescription>
              Введите пароль администратора для доступа к чату
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Input
                type="password"
                placeholder="Введите пароль"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (adminPassword === 'ValentinaGolosova2024') {
                      localStorage.setItem('userToken', 'admin_forever_access_2024');
                      localStorage.setItem('isAdmin', 'true');
                      setToken('admin_forever_access_2024');
                      setIsAdmin(true);
                      setShowAdminDialog(false);
                      setAdminPassword('');
                      toast({
                        title: 'Доступ активирован! 🔑',
                        description: 'Добро пожаловать, администратор',
                      });
                    } else {
                      toast({
                        title: 'Неверный пароль',
                        description: 'Попробуйте еще раз',
                        variant: 'destructive',
                      });
                    }
                  }
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  if (adminPassword === 'ValentinaGolosova2024') {
                    localStorage.setItem('userToken', 'admin_forever_access_2024');
                    setToken('admin_forever_access_2024');
                    setShowAdminDialog(false);
                    setAdminPassword('');
                    toast({
                      title: 'Доступ активирован! 🔑',
                      description: 'Добро пожаловать, администратор',
                    });
                  } else {
                    toast({
                      title: 'Неверный пароль',
                      description: 'Попробуйте еще раз',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                Войти
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAdminDialog(false);
                  setAdminPassword('');
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}