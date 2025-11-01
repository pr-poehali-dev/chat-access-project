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
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Icon name="GraduationCap" size={32} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Курс "Банкротство физических лиц"</h2>
                    <p className="text-lg text-muted-foreground mb-4">
                      Автор: <span className="font-semibold text-foreground">Валентина Голосова</span> — арбитражный управляющий
                    </p>
                    <p className="text-foreground">
                      Пройдите процедуру банкротства самостоятельно и сэкономьте до 150 000 рублей на услугах юристов
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Icon name="Video" size={24} className="text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">7 видеомодулей</h3>
                  <p className="text-sm text-muted-foreground">Пошаговая инструкция с разбором каждого этапа</p>
                </Card>

                <Card className="p-4 text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Icon name="FileText" size={24} className="text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Шаблоны документов</h3>
                  <p className="text-sm text-muted-foreground">Готовые формы и образцы для всех процедур</p>
                </Card>

                <Card className="p-4 text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Icon name="Users" size={24} className="text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Закрытый чат</h3>
                  <p className="text-sm text-muted-foreground">Общение с другими участниками курса</p>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Программа курса</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="font-semibold text-primary-foreground text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Введение в банкротство физических лиц</h4>
                      <p className="text-sm text-muted-foreground">Основы законодательства, кому подходит процедура, плюсы и минусы</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="font-semibold text-primary-foreground text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Подготовка документов</h4>
                      <p className="text-sm text-muted-foreground">Какие документы нужны, как их правильно оформить и собрать</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="font-semibold text-primary-foreground text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Подача заявления в суд</h4>
                      <p className="text-sm text-muted-foreground">Пошаговая инструкция по подаче и регистрации заявления</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="font-semibold text-primary-foreground text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Судебные заседания</h4>
                      <p className="text-sm text-muted-foreground">Как вести себя в суде, что говорить, частые вопросы судей</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="font-semibold text-primary-foreground text-sm">5</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Реструктуризация долгов</h4>
                      <p className="text-sm text-muted-foreground">Процедура реструктуризации, как договориться с кредиторами</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="font-semibold text-primary-foreground text-sm">6</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Реализация имущества</h4>
                      <p className="text-sm text-muted-foreground">Что может быть изъято, как защитить свое имущество</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="font-semibold text-primary-foreground text-sm">7</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Завершение процедуры</h4>
                      <p className="text-sm text-muted-foreground">Списание долгов, последствия банкротства, жизнь после</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-primary/10 border-primary/30">
                <div className="flex items-start gap-4">
                  <Icon name="ShieldCheck" size={32} className="text-primary-foreground shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Гарантия результата</h3>
                    <p className="text-muted-foreground mb-3">
                      Более 500 выпускников уже успешно прошли процедуру банкротства и списали долги от 300 000 до 5 000 000 рублей
                    </p>
                    <p className="text-sm text-muted-foreground">
                      При правильном следовании инструкциям курса, вы гарантированно пройдете процедуру банкротства
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

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
                      <h3 className="font-semibold text-lg">Базовый</h3>
                      <p className="text-sm text-muted-foreground">Месяц доступа к курсу</p>
                    </div>
                  </div>
                  <div className="py-4">
                    <div className="text-3xl font-bold text-foreground mb-1">2 999 ₽</div>
                    <p className="text-sm text-muted-foreground">100 ₽ в день</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-accent mt-0.5" />
                      <span>7 видеомодулей курса</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-accent mt-0.5" />
                      <span>Шаблоны документов</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-accent mt-0.5" />
                      <span>Доступ к закрытому чату</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-accent mt-0.5" />
                      <span>30 дней поддержки</span>
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

              <Card className="p-6 border-2 border-secondary hover:shadow-lg transition-shadow">
                <Badge className="mb-4 bg-secondary text-secondary-foreground">Рекомендуем</Badge>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <Icon name="Star" size={24} className="text-secondary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Полный курс</h3>
                      <p className="text-sm text-muted-foreground">3 месяца сопровождения</p>
                    </div>
                  </div>
                  <div className="py-4">
                    <div className="text-3xl font-bold text-foreground mb-1">7 999 ₽</div>
                    <p className="text-sm text-muted-foreground">89 ₽ в день · экономия 62%</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-accent mt-0.5" />
                      <span>Весь курс + материалы</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-accent mt-0.5" />
                      <span>Доступ к чату — 3 месяца</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-accent mt-0.5" />
                      <span>Личная консультация с экспертом</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-accent mt-0.5" />
                      <span>Проверка документов</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={16} className="text-accent mt-0.5" />
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
              <Card className="mt-6 p-6 bg-secondary/10 border-secondary/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Icon name="Info" size={20} className="text-secondary-foreground" />
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
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Icon name="Shield" size={18} className="text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Анонимность</h3>
                    <p className="text-sm text-muted-foreground">
                      Все сообщения публикуются без указания автора. Ваша личность полностью защищена.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Icon name="Users" size={18} className="text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Уважение</h3>
                    <p className="text-sm text-muted-foreground">
                      Соблюдайте деловой этикет, уважайте мнения других участников чата.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Icon name="AlertTriangle" size={18} className="text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Запрещено</h3>
                    <p className="text-sm text-muted-foreground">
                      Оскорбления, спам, реклама, распространение личной информации других участников.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Icon name="Lock" size={18} className="text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Конфиденциальность</h3>
                    <p className="text-sm text-muted-foreground">
                      Не распространяйте информацию из чата за его пределами без согласия участников.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Icon name="Target" size={18} className="text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Тематика чата</h3>
                    <p className="text-sm text-muted-foreground">
                      Обсуждаем только вопросы банкротства: ход процедуры, документы, опыт общения с судами и управляющими.
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
                          <p className="font-medium mb-1">Сколько длится процедура банкротства?</p>
                          <p className="text-muted-foreground">
                            В среднем от 6 до 12 месяцев. Точные сроки зависят от загруженности суда и сложности вашего дела.
                          </p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Какие долги можно списать?</p>
                          <p className="text-muted-foreground">
                            Кредиты, займы, долги по ЖКХ, налоги. Нельзя списать алименты, возмещение вреда здоровью, зарплату работникам.
                          </p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Нужен ли мне юрист для банкротства?</p>
                          <p className="text-muted-foreground">
                            Нет! Наш курс содержит все материалы для самостоятельного прохождения процедуры. Экономия до 150 000 рублей.
                          </p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Как продлить доступ к курсу?</p>
                          <p className="text-muted-foreground">
                            Оформите подписку повторно в разделе "Тарифы". Доступ продлится автоматически.
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
                        <p className="text-sm text-muted-foreground">info@bankrot-kurs.ru</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Icon name="MessageCircle" size={20} className="text-primary" />
                      <div>
                        <p className="text-sm font-medium">Telegram</p>
                        <p className="text-sm text-muted-foreground">@bankrot_kurs_support</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Icon name="Globe" size={20} className="text-primary" />
                      <div>
                        <p className="text-sm font-medium">Официальный сайт</p>
                        <a href="https://bankrot-kurs.ru" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                          bankrot-kurs.ru
                        </a>
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