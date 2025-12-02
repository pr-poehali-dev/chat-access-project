import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const SUB_API = 'https://functions.poehali.dev/957d493f-5bdb-4f6b-9b96-4f755f9d1d9b';

export function useAppAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('userToken'));
  const [isAdmin, setIsAdmin] = useState<boolean>(localStorage.getItem('isAdmin') === 'true');
  const [authorName, setAuthorName] = useState<string>(localStorage.getItem('authorName') || '');
  const [subscription, setSubscription] = useState<any>(null);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const { toast } = useToast();

  const handleLogin = useCallback((newToken: string, adminStatus: boolean = false) => {
    setToken(newToken);
    setIsAdmin(adminStatus);
    localStorage.setItem('userToken', newToken);
    localStorage.setItem('isAdmin', adminStatus.toString());
    setShowTokenDialog(false);
    setShowAdminDialog(false);
    
    toast({
      title: 'Вход выполнен',
      description: 'Теперь вы можете пользоваться всеми функциями приложения'
    });
  }, [toast]);

  const verifyAndLoginWithToken = useCallback(async (tokenToVerify: string) => {
    try {
      const res = await fetch(`${SUB_API}?token=${tokenToVerify}`);
      const data = await res.json();
      
      if ((data.valid && data.is_active) || data.is_active) {
        handleLogin(tokenToVerify, false);
        window.history.replaceState({}, '', window.location.pathname);
        const expiresDate = new Date(data.expires_at).toLocaleDateString('ru-RU');
        toast({
          title: 'Добро пожаловать!',
          description: `Ваша подписка активна до ${expiresDate}`
        });
      } else {
        toast({
          title: 'Ошибка входа',
          description: data.error || 'Токен недействителен или подписка истекла',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось проверить токен',
        variant: 'destructive'
      });
    }
  }, [handleLogin, toast]);

  const loadSubscription = useCallback(async () => {
    if (!token || isAdmin) return;
    
    try {
      const res = await fetch(SUB_API, {
        headers: { 'X-User-Token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken && !token) {
      verifyAndLoginWithToken(urlToken);
    } else if (token && !isAdmin) {
      loadSubscription();
    }
  }, [token, isAdmin, verifyAndLoginWithToken, loadSubscription]);

  const handleLogout = () => {
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem('userToken');
    localStorage.removeItem('isAdmin');
    toast({
      title: 'Выход выполнен',
      description: 'Вы вышли из системы'
    });
  };

  const handleNameSave = (name: string) => {
    setAuthorName(name);
    localStorage.setItem('authorName', name);
    setShowNameDialog(false);
  };

  return {
    token,
    isAdmin,
    authorName,
    subscription,
    showAdminDialog,
    showTokenDialog,
    showNameDialog,
    setShowAdminDialog,
    setShowTokenDialog,
    setShowNameDialog,
    handleLogin,
    handleLogout,
    handleNameSave,
    loadSubscription
  };
}