import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

export default function SupportTab() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/1a978b7d-cc76-4ab3-b9eb-11037b15657a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, message })
      });

      if (response.ok) {
        toast({
          title: 'Благодарим за обращение! ✉️',
          description: 'Ваше сообщение отправлено. Наши специалисты свяжутся с вами в ближайшее время.',
          duration: 5000
        });
        setName('');
        setEmail('');
        setMessage('');
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      toast({
        title: 'Ошибка отправки',
        description: 'Попробуйте еще раз',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon name="HeadphonesIcon" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Техническая поддержка</h3>
            <p className="text-sm text-muted-foreground">Ответим в течение 24 часов</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Ваше имя</label>
            <Input
              placeholder="Введите ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Сообщение</label>
            <Textarea
              placeholder="Опишите вашу проблему или вопрос..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={isLoading}
              className="min-h-[120px]"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <Icon name="Send" size={18} className="mr-2" />
                Отправить сообщение
              </>
            )}
          </Button>
        </form>
      </Card>

      <Card className="p-6 bg-muted/30">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Icon name="Clock" size={18} className="text-primary" />
          Время ответа
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          Мы стараемся отвечать на все обращения в течение 24 часов. В период высокой нагрузки ответ может занять до 48 часов.
        </p>

        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Icon name="Mail" size={18} className="text-primary" />
          Альтернативная связь
        </h4>
        <p className="text-sm text-muted-foreground">
          Вы также можете написать нам напрямую на почту: <span className="font-medium text-foreground">melni-v@yandex.ru</span>
        </p>
      </Card>

      <Card className="p-4 bg-secondary/10 border-secondary/30">
        <div className="flex gap-3">
          <Icon name="Info" size={18} className="text-secondary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Перед отправкой вопроса проверьте раздел <strong>Правила</strong> — возможно, там уже есть ответ на ваш вопрос
          </p>
        </div>
      </Card>
    </div>
  );
}