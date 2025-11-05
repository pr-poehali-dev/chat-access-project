import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SubscriptionTabProps {
  subscription: any;
}

const PAYMENT_API = 'https://functions.poehali.dev/bafac542-4401-4a0c-8fc0-95ff945b8768';

export default function SubscriptionTab({ subscription }: SubscriptionTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'week' | 'month' | null>(null);
  const { toast } = useToast();

  const handlePaymentClick = (plan: 'week' | 'month') => {
    setSelectedPlan(plan);
    setShowEmailDialog(true);
  };

  const handlePayment = async () => {
    if (!email || !selectedPlan) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный email',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setShowEmailDialog(false);
    try {
      const res = await fetch(PAYMENT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, email })
      });
      
      const data = await res.json();
      console.log('Payment API response:', { status: res.status, data });
      
      if (res.ok && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || data.details || 'Не удалось создать платёж',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Проблема с подключением к платёжной системе',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {subscription?.is_active ? (
        <Card className="p-6 bg-secondary/10 border-secondary">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Icon name="CheckCircle" size={24} className="text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Ваша подписка активна</h3>
              <p className="text-muted-foreground mb-3">
                Доступ к закрытому чату и материалам курса до {new Date(subscription.expires_at).toLocaleDateString('ru-RU')}
              </p>
              <Badge variant="secondary" className="gap-2">
                <Icon name="Calendar" size={14} />
                Осталось {Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} дн.
              </Badge>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-6 bg-muted/30">
            <div className="text-center">
              <Icon name="Lock" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Доступ к чату закрыт</h3>
              <p className="text-muted-foreground">
                Оформите подписку, чтобы получить доступ к закрытому сообществу участников курса
              </p>
            </div>
          </Card>
          

        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 border-2 hover:border-primary transition-colors">
          <div className="text-center">
            <Badge className="mb-4">Пробный период</Badge>
            <div className="mb-4">
              <span className="text-4xl font-bold">999₽</span>
              <span className="text-muted-foreground">/неделя</span>
            </div>
            <ul className="space-y-3 mb-6 text-left">
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-secondary shrink-0 mt-0.5" />
                <span className="text-sm">Доступ к закрытому чату на 7 дней</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-secondary shrink-0 mt-0.5" />
                <span className="text-sm">Общение с другими участниками</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-secondary shrink-0 mt-0.5" />
                <span className="text-sm">Поддержка куратора</span>
              </li>
            </ul>
            <Button
              className="w-full"
              onClick={() => handlePaymentClick('week')}
              disabled={subscription?.is_active || isLoading}
            >
              {isLoading ? 'Загрузка...' : 'Оплатить 999₽'}
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-2 border-primary relative overflow-hidden">
          <Badge className="absolute top-4 right-4 bg-primary">Популярный</Badge>
          <div className="text-center">
            <Badge className="mb-4" variant="secondary">Полный доступ</Badge>
            <div className="mb-4">
              <span className="text-4xl font-bold">3999₽</span>
              <span className="text-muted-foreground">/месяц</span>
            </div>
            <ul className="space-y-3 mb-6 text-left">
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-secondary shrink-0 mt-0.5" />
                <span className="text-sm">Доступ к закрытому чату на 30 дней</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-secondary shrink-0 mt-0.5" />
                <span className="text-sm">Общение с другими участниками</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-secondary shrink-0 mt-0.5" />
                <span className="text-sm">Поддержка куратора</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={20} className="text-secondary shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-primary">Экономия 1000₽</span>
              </li>
            </ul>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => handlePaymentClick('month')}
              disabled={subscription?.is_active || isLoading}
            >
              {isLoading ? 'Загрузка...' : 'Оплатить 3999₽'}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-primary/10 border-primary/30">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary font-semibold">
            <Icon name="CreditCard" size={18} />
            <span>Безопасная оплата</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Платежи обрабатываются через ЮKassa (Яндекс). После успешной оплаты доступ к чату откроется автоматически.
          </p>
        </div>
      </Card>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Укажите ваш email</DialogTitle>
            <DialogDescription>
              На этот email придёт чек и токен для доступа к чату
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePayment()}
            />
            <Button className="w-full" onClick={handlePayment} disabled={!email}>
              Перейти к оплате
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}