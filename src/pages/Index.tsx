import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: number;
  content: string;
  created_at: string;
}

const CHAT_API = 'https://functions.poehali.dev/2143f652-3843-436a-923a-7e36c7c4d228';
const SUB_API = 'https://functions.poehali.dev/957d493f-5bdb-4f6b-9b96-4f755f9d1d9b';

export default function Index() {
  const [activeTab, setActiveTab] = useState('subscription');
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

  const loadMessages = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(CHAT_API, {
        headers: { 'X-User-Token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      } else {
        toast({
          title: 'Ошибка доступа',
          description: 'Проверьте статус подписки',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
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
              <h1 className="text-xl font-semibold text-foreground">Закрытый чат</h1>
              <p className="text-xs text-muted-foreground">Профессиональное общение</p>
            </div>
          </div>
          {subscription?.is_active && (
            <Badge variant="outline" className="gap-2">
              <Icon name="CheckCircle" size={14} />
              Активна до {new Date(subscription.expires_at).toLocaleDateString('ru-RU')}
            </Badge>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat" disabled={!token || !subscription?.is_active}>
              <Icon name="MessageSquare" size={16} className="mr-2" />
              Чат
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <Icon name="CreditCard" size={16} className="mr-2" />
              Подписка
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

          <TabsContent value="chat" className="mt-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <h2 className="text-lg font-semibold">Общий чат</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadMessages}
                    disabled={isLoading}
                  >
                    <Icon name="RefreshCw" size={16} className="mr-2" />
                    Обновить
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="MessageSquare" size={48} className="mx-auto mb-3 opacity-30" />
                      <p>Сообщений пока нет. Начните общение первым!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className="p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <p className="text-foreground mb-2">{msg.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Введите ваше сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="resize-none"
                      rows={3}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || isLoading}
                      className="shrink-0"
                    >
                      <Icon name="Send" size={16} className="mr-2" />
                      Отправить
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name="Calendar" size={24} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Неделя</h3>
                      <p className="text-sm text-muted-foreground">7 дней доступа</p>
                    </div>
                  </div>
                  <div className="py-4">
                    <div className="text-3xl font-bold text-foreground mb-1">499 ₽</div>
                    <p className="text-sm text-muted-foreground">71 ₽ в день</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-primary mt-0.5" />
                      <span>Полный доступ к чату</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-primary mt-0.5" />
                      <span>История сообщений</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-primary mt-0.5" />
                      <span>Анонимность гарантирована</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={() => createSubscription('week')}
                    disabled={isLoading || (subscription?.is_active)}
                  >
                    Оформить подписку
                  </Button>
                </div>
              </Card>

              <Card className="p-6 border-2 border-primary hover:shadow-lg transition-shadow">
                <Badge className="mb-4">Популярный</Badge>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name="Calendar" size={24} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Месяц</h3>
                      <p className="text-sm text-muted-foreground">30 дней доступа</p>
                    </div>
                  </div>
                  <div className="py-4">
                    <div className="text-3xl font-bold text-foreground mb-1">1 490 ₽</div>
                    <p className="text-sm text-muted-foreground">50 ₽ в день · экономия 30%</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-primary mt-0.5" />
                      <span>Полный доступ к чату</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-primary mt-0.5" />
                      <span>История сообщений</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-primary mt-0.5" />
                      <span>Анонимность гарантирована</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-primary mt-0.5" />
                      <span>Приоритетная поддержка</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={() => createSubscription('month')}
                    disabled={isLoading || (subscription?.is_active)}
                  >
                    Оформить подписку
                  </Button>
                </div>
              </Card>
            </div>

            {subscription?.is_active && (
              <Card className="mt-6 p-6 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon name="Info" size={20} className="text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">Ваша подписка активна</h3>
                    <p className="text-sm text-muted-foreground">
                      Доступ к чату действует до {new Date(subscription.expires_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Правила чата</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon name="Shield" size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Анонимность</h3>
                    <p className="text-sm text-muted-foreground">
                      Все сообщения публикуются без указания автора. Ваша личность полностью защищена.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon name="Users" size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Уважение</h3>
                    <p className="text-sm text-muted-foreground">
                      Соблюдайте деловой этикет, уважайте мнения других участников чата.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon name="AlertTriangle" size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Запрещено</h3>
                    <p className="text-sm text-muted-foreground">
                      Оскорбления, спам, реклама, распространение личной информации других участников.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon name="Lock" size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Конфиденциальность</h3>
                    <p className="text-sm text-muted-foreground">
                      Не распространяйте информацию из чата за его пределами без согласия участников.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon name="Target" size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Тематика</h3>
                    <p className="text-sm text-muted-foreground">
                      Чат предназначен для профессионального общения и обмена опытом.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Поддержка</h2>
              <div className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <Icon name="HelpCircle" size={20} className="text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-2">Часто задаваемые вопросы</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-medium mb-1">Как продлить подписку?</p>
                          <p className="text-muted-foreground">
                            Оформите новую подписку в разделе "Подписка". Она автоматически активируется после окончания текущей.
                          </p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Можно ли вернуть деньги?</p>
                          <p className="text-muted-foreground">
                            Возврат средств возможен в течение 24 часов с момента оформления подписки.
                          </p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Как сохранить токен доступа?</p>
                          <p className="text-muted-foreground">
                            Токен автоматически сохраняется в браузере. Не удаляйте данные сайта.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Связаться с нами</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Icon name="Mail" size={20} className="text-primary" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">support@example.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Icon name="MessageCircle" size={20} className="text-primary" />
                      <div>
                        <p className="text-sm font-medium">Telegram</p>
                        <p className="text-sm text-muted-foreground">@support_chat</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="font-semibold mb-4">Написать в поддержку</h3>
                  <form className="space-y-4">
                    <Input placeholder="Ваш email" type="email" />
                    <Textarea placeholder="Опишите вашу проблему или вопрос..." rows={5} />
                    <Button className="w-full">
                      <Icon name="Send" size={16} className="mr-2" />
                      Отправить сообщение
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
