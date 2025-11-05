import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import AboutTab from '@/components/AboutTab';
import ChatTab from '@/components/ChatTab';
import SubscriptionTab from '@/components/SubscriptionTab';
import RulesTab from '@/components/RulesTab';
import SupportTab from '@/components/SupportTab';

interface Message {
  id: number;
  content: string;
  created_at: string;
}

const CHAT_API = 'https://functions.poehali.dev/2143f652-3843-436a-923a-7e36c7c4d228';
const SUB_API = 'https://functions.poehali.dev/957d493f-5bdb-4f6b-9b96-4f755f9d1d9b';

export default function Index() {
  const [activeTab, setActiveTab] = useState('about');
  const [token, setToken] = useState<string | null>(localStorage.getItem('userToken'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const { toast } = useToast();

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

  const loadSubscription = async () => {
    try {
      const res = await fetch(SUB_API, {
        headers: { 'X-User-Token': token! }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
        if (data.is_active) {
          setActiveTab('chat');
        }
      }
    } catch (error) {
      console.error('Failed to load subscription');
    }
  };

  const loadMessages = async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(CHAT_API, {
        headers: { 'X-User-Token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
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

  const createSubscription = async (plan: 'week' | 'month') => {
    setIsLoading(true);
    try {
      const res = await fetch(SUB_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userToken', data.token);
        setToken(data.token);
        toast({
          title: 'Подписка оформлена',
          description: `Доступ активен до ${new Date(data.expires_at).toLocaleDateString('ru-RU')}`
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось оформить подписку',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !token) return;
    setIsLoading(true);
    try {
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token
        },
        body: JSON.stringify({ content: newMessage })
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
          {subscription?.is_active && (
            <Badge variant="outline" className="gap-2 border-secondary text-secondary-foreground bg-secondary/10">
              <Icon name="CheckCircle" size={14} />
              Активна до {new Date(subscription.expires_at).toLocaleDateString('ru-RU')}
            </Badge>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="about">
              <Icon name="Info" size={16} className="mr-2" />
              О курсе
            </TabsTrigger>
            <TabsTrigger value="chat" disabled={!token || !subscription?.is_active}>
              <Icon name="MessageSquare" size={16} className="mr-2" />
              Чат
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <Icon name="CreditCard" size={16} className="mr-2" />
              Тарифы
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Icon name="FileText" size={16} className="mr-2" />
              Правила
            </TabsTrigger>
            <TabsTrigger value="support">
              <Icon name="HeadphonesIcon" size={16} className="mr-2" />
              Поддержка
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <AboutTab />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <ChatTab
              messages={messages}
              newMessage={newMessage}
              isLoading={isLoading}
              onMessageChange={setNewMessage}
              onSendMessage={sendMessage}
            />
          </TabsContent>

          <TabsContent value="subscription" className="mt-6">
            <SubscriptionTab
              subscription={subscription}
              isLoading={isLoading}
              onCreateSubscription={createSubscription}
            />
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <RulesTab />
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <SupportTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
