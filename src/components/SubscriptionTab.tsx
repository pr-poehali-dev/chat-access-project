import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface SubscriptionTabProps {
  subscription: any;
  isLoading: boolean;
  onCreateSubscription: (plan: 'week' | 'month') => void;
}

export default function SubscriptionTab({ subscription, isLoading, onCreateSubscription }: SubscriptionTabProps) {
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
        <Card className="p-6 bg-muted/30">
          <div className="text-center">
            <Icon name="Lock" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Доступ к чату закрыт</h3>
            <p className="text-muted-foreground">
              Оформите подписку, чтобы получить доступ к закрытому сообществу участников курса
            </p>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 border-2 hover:border-primary transition-colors">
          <div className="text-center">
            <Badge className="mb-4">Пробный период</Badge>
            <div className="mb-4">
              <span className="text-4xl font-bold">299₽</span>
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
              onClick={() => onCreateSubscription('week')}
              disabled={isLoading || subscription?.is_active}
            >
              Оформить на неделю
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-2 border-primary relative overflow-hidden">
          <Badge className="absolute top-4 right-4 bg-primary">Популярный</Badge>
          <div className="text-center">
            <Badge className="mb-4" variant="secondary">Полный доступ</Badge>
            <div className="mb-4">
              <span className="text-4xl font-bold">999₽</span>
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
                <span className="text-sm font-semibold text-primary">Экономия 197₽</span>
              </li>
            </ul>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => onCreateSubscription('month')}
              disabled={isLoading || subscription?.is_active}
            >
              Оформить на месяц
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">
          <Icon name="Info" size={16} className="inline mr-1" />
          После оформления подписки вы получите немедленный доступ к чату участников
        </p>
      </Card>
    </div>
  );
}
