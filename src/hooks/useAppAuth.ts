import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (token) {
      loadSubscription();
    }
  }, [token]);

  const loadSubscription = async () => {
    if (!token) return;
    
    try {
      console.log('Loading subscription for token:', token);
      const res = await fetch(SUB_API, {
        headers: { 'X-User-Token': token }
      });
      console.log('Subscription response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Subscription data:', data);
        setSubscription(data);
      } else {
        console.error('Subscription request failed:', res.status);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const handleLogin = (newToken: string, adminStatus: boolean = false) => {
    console.log('handleLogin called with token:', newToken, 'isAdmin:', adminStatus);
    setToken(newToken);
    setIsAdmin(adminStatus);
    localStorage.setItem('userToken', newToken);
    localStorage.setItem('isAdmin', adminStatus.toString());
    setShowTokenDialog(false);
    setShowAdminDialog(false);
    
    // Загружаем подписку сразу после логина
    if (newToken && !adminStatus) {
      setTimeout(() => {
        fetch(SUB_API, {
          headers: { 'X-User-Token': newToken }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              console.log('Subscription loaded after login:', data);
              setSubscription(data);
            }
          })
          .catch(err => console.error('Error loading subscription:', err));
      }, 100);
    }
    
    toast({
      title: 'Вход выполнен',
      description: 'Теперь вы можете пользоваться всеми функциями приложения'
    });
  };

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