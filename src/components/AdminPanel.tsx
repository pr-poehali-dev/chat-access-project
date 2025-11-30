import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  user_token: string;
  email: string | null;
  plan: string;
  expires_at: string;
  created_at: string;
  is_blocked: boolean;
  message_count: number;
}

interface AdminPanelProps {
  token: string;
}

const ADMIN_API = 'https://functions.poehali.dev/72b37491-e95d-4fd9-a060-14e7602127bd';

export default function AdminPanel({ token }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(ADMIN_API, {
        headers: { 'X-User-Token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        toast({
          title: 'Ошибка загрузки',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка соединения',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBlockUser = async (userToken: string, currentBlocked: boolean) => {
    try {
      const res = await fetch(ADMIN_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token
        },
        body: JSON.stringify({
          user_token: userToken,
          is_blocked: !currentBlocked
        })
      });
      
      if (res.ok) {
        toast({
          title: currentBlocked ? 'Доступ восстановлен' : 'Пользователь заблокирован'
        });
        loadUsers();
      } else {
        toast({
          title: 'Ошибка обновления',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка соединения',
        variant: 'destructive'
      });
    }
  };



  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="Shield" size={20} className="text-primary" />
            <h3 className="text-lg font-semibold">Управление пользователями</h3>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={loadUsers}
            disabled={isLoading}
            className="gap-2"
          >
            <Icon name="RefreshCw" size={16} />
            Обновить
          </Button>
        </div>

        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Пользователей пока нет
            </p>
          ) : (
            users.map(user => {
              const isExpired = new Date(user.expires_at) < new Date();
              const isActive = !isExpired && !user.is_blocked;
              
              return (
                <Card key={user.user_token} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {user.email || 'Без email'}
                        </span>
                        {isActive && (
                          <Badge variant="default" className="gap-1">
                            <Icon name="CheckCircle" size={12} />
                            Активна
                          </Badge>
                        )}
                        {user.is_blocked && (
                          <Badge variant="destructive" className="gap-1">
                            <Icon name="Ban" size={12} />
                            Заблокирован
                          </Badge>
                        )}
                        {isExpired && !user.is_blocked && (
                          <Badge variant="secondary" className="gap-1">
                            <Icon name="Clock" size={12} />
                            Истекла
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Тариф:</span> {user.plan}
                        </div>
                        <div>
                          <span className="font-medium">Сообщений:</span> {user.message_count}
                        </div>
                        <div>
                          <span className="font-medium">Оплатил:</span> {new Date(user.created_at).toLocaleDateString('ru-RU')}
                        </div>
                        <div>
                          <span className="font-medium">Истекает:</span> {new Date(user.expires_at).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Токен:</span> {user.user_token.substring(0, 16)}...
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant={user.is_blocked ? "outline" : "destructive"}
                      onClick={() => toggleBlockUser(user.user_token, user.is_blocked)}
                      className="gap-2"
                    >
                      <Icon name={user.is_blocked ? "Unlock" : "Ban"} size={14} />
                      {user.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}