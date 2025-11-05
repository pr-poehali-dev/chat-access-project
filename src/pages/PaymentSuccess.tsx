import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const token = searchParams.get('token');
    const plan = searchParams.get('plan');
    
    if (token) {
      localStorage.setItem('userToken', token);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6">
          <Icon name="CheckCircle" size={48} className="text-secondary" />
        </div>
        
        <h1 className="text-2xl font-bold mb-3">Оплата прошла успешно!</h1>
        
        <p className="text-muted-foreground mb-6">
          Ваша подписка активирована. Теперь у вас есть полный доступ к закрытому чату участников курса.
        </p>

        <div className="bg-primary/10 rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            Автоматический переход на главную через {countdown} сек...
          </p>
        </div>

        <Button 
          onClick={() => navigate('/')}
          className="w-full gap-2"
        >
          <Icon name="Home" size={18} />
          Перейти к чату
        </Button>
      </Card>
    </div>
  );
}
