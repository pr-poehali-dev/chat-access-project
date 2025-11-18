import { useState } from 'react';
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

interface AuthDialogsProps {
  showAdminDialog: boolean;
  showTokenDialog: boolean;
  showNameDialog: boolean;
  onAdminDialogChange: (open: boolean) => void;
  onTokenDialogChange: (open: boolean) => void;
  onNameDialogChange: (open: boolean) => void;
  onAdminLogin: (password: string) => void;
  onTokenLogin: (token: string) => void;
  onNameSave: (name: string) => void;
  authorName: string;
}

export default function AuthDialogs({
  showAdminDialog,
  showTokenDialog,
  showNameDialog,
  onAdminDialogChange,
  onTokenDialogChange,
  onNameDialogChange,
  onAdminLogin,
  onTokenLogin,
  onNameSave,
  authorName,
}: AuthDialogsProps) {
  const [adminPassword, setAdminPassword] = useState('');
  const [userToken, setUserToken] = useState('');
  const [tempName, setTempName] = useState(authorName);
  const { toast } = useToast();

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите пароль администратора',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const res = await fetch('https://functions.poehali.dev/abd02ab1-6477-487f-8745-ebed9c3cb6ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('isAdmin', 'true');
        onAdminLogin(data.token);
        onAdminDialogChange(false);
        toast({
          title: 'Вход выполнен',
          description: 'Вы вошли как администратор'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Неверный пароль',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось войти',
        variant: 'destructive'
      });
    }
  };

  const handleTokenLogin = () => {
    if (!userToken.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите токен доступа',
        variant: 'destructive'
      });
      return;
    }
    
    localStorage.setItem('userToken', userToken.trim());
    onTokenLogin(userToken.trim());
    onTokenDialogChange(false);
    toast({
      title: 'Токен сохранён',
      description: 'Проверяем доступ к чату...'
    });
  };

  const handleNameSave = () => {
    const trimmedName = tempName.trim();
    if (trimmedName.length < 2) {
      toast({
        title: 'Ошибка',
        description: 'Имя должно содержать минимум 2 символа',
        variant: 'destructive'
      });
      return;
    }
    localStorage.setItem('authorName', trimmedName);
    onNameSave(trimmedName);
    onNameDialogChange(false);
    toast({
      title: 'Имя сохранено',
      description: `Ваши сообщения будут подписаны как "${trimmedName}"`
    });
  };

  return (
    <>
      <Dialog open={showNameDialog} onOpenChange={onNameDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="User" size={24} className="text-primary" />
              Представьтесь участникам чата
            </DialogTitle>
            <DialogDescription>
              Укажите имя или логин, под которым будут публиковаться ваши сообщения
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              type="text"
              placeholder="Ваше имя или логин"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              maxLength={100}
            />
            <Button onClick={handleNameSave} className="w-full gap-2">
              <Icon name="Check" size={18} />
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdminDialog} onOpenChange={onAdminDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Shield" size={24} className="text-primary" />
              Вход для администратора
            </DialogTitle>
            <DialogDescription>
              Введите пароль администратора для доступа к панели управления
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              type="password"
              placeholder="Пароль администратора"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <Button onClick={handleAdminLogin} className="w-full gap-2">
              <Icon name="LogIn" size={18} />
              Войти как админ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTokenDialog} onOpenChange={onTokenDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Key" size={24} className="text-primary" />
              Вход с токеном доступа
            </DialogTitle>
            <DialogDescription>
              Введите токен, который вы получили после оплаты подписки
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              type="text"
              placeholder="Вставьте ваш токен"
              value={userToken}
              onChange={(e) => setUserToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTokenLogin()}
            />
            <Button onClick={handleTokenLogin} className="w-full gap-2">
              <Icon name="LogIn" size={18} />
              Войти
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}