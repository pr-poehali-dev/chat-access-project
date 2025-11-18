import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface AppHeaderProps {
  token: string | null;
  isAdmin: boolean;
  subscription: any;
  onTokenDialogOpen: () => void;
  onAdminDialogOpen: () => void;
  onInstallDialogOpen: () => void;
  onLogout: () => void;
}

export default function AppHeader({
  token,
  isAdmin,
  subscription,
  onTokenDialogOpen,
  onAdminDialogOpen,
  onInstallDialogOpen,
  onLogout,
}: AppHeaderProps) {
  return (
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
            <>
              <Button 
                onClick={onTokenDialogOpen}
                variant="default"
                className="gap-2"
                size="sm"
              >
                <Icon name="Key" size={16} />
                Войти с токеном
              </Button>
              <Button 
                onClick={onAdminDialogOpen}
                variant="outline"
                className="gap-2"
                size="sm"
              >
                <Icon name="Shield" size={16} />
                Админ
              </Button>
            </>
          )}
          {token && (
            <>
              {isAdmin && (
                <Badge variant="default" className="gap-2">
                  <Icon name="Shield" size={14} />
                  Администратор
                </Badge>
              )}
              <Button 
                onClick={onLogout}
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
            onClick={onInstallDialogOpen}
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
  );
}
