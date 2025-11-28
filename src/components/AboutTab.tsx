import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function AboutTab() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowInstructions(true);
      toast({
        title: '📱 Инструкция по установке',
        description: 'Следуйте инструкциям ниже для вашей операционной системы',
        duration: 5000,
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast({
        title: '✅ Приложение установлено!',
        description: 'Теперь вы можете запускать приложение с главного экрана',
        duration: 5000,
      });
    }
    
    setDeferredPrompt(null);
    setCanInstall(false);
  };
  return (
    <div className="space-y-6">
      <a href="https://bankrot-kurs.ru/" target="_blank" rel="noopener noreferrer" className="block">
        <Card className="p-6 bg-gradient-to-br from-primary/30 to-primary/20 border-primary hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shrink-0">
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
      </a>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3">
            <Icon name="Video" size={24} className="text-primary-foreground" />
          </div>
          <h3 className="font-semibold mb-2">7 видеомодулей</h3>
          <p className="text-sm text-muted-foreground">Пошаговая инструкция с разбором каждого этапа</p>
        </Card>

        <Card className="p-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3">
            <Icon name="FileText" size={24} className="text-primary-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Шаблоны документов</h3>
          <p className="text-sm text-muted-foreground">Готовые формы и образцы для всех процедур</p>
        </Card>

        <Card className="p-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3">
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
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="font-semibold text-primary-foreground text-sm">1</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Введение в банкротство физических лиц</h4>
              <p className="text-sm text-muted-foreground">Основы законодательства, кому подходит процедура, плюсы и минусы</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="font-semibold text-primary-foreground text-sm">2</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Подготовка документов</h4>
              <p className="text-sm text-muted-foreground">Какие документы нужны, как их правильно оформить и собрать</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="font-semibold text-primary-foreground text-sm">3</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Подача заявления в суд</h4>
              <p className="text-sm text-muted-foreground">Пошаговая инструкция по подаче и регистрации заявления</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="font-semibold text-primary-foreground text-sm">4</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Судебные заседания</h4>
              <p className="text-sm text-muted-foreground">Как вести себя в суде, что говорить, частые вопросы судей</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="font-semibold text-primary-foreground text-sm">5</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Реструктуризация долгов</h4>
              <p className="text-sm text-muted-foreground">Процедура реструктуризации, как договориться с кредиторами</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="font-semibold text-primary-foreground text-sm">6</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Реализация имущества</h4>
              <p className="text-sm text-muted-foreground">Что может быть изъято, как защитить свое имущество</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="font-semibold text-primary-foreground text-sm">7</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Завершение процедуры</h4>
              <p className="text-sm text-muted-foreground">Списание долгов, последствия банкротства, жизнь после</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-primary/30 border-primary">
        <div className="flex items-start gap-4">
          <Icon name="ShieldCheck" size={32} className="text-primary shrink-0" />
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

      <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <div className="flex items-start gap-4">
          <Icon name="Smartphone" size={32} className="text-blue-600 shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              📱 Установите приложение на телефон
            </h3>
            
            <p className="text-muted-foreground mb-4">
              Установите приложение для быстрого доступа с главного экрана, работы офлайн и получения push-уведомлений
            </p>

            <Button 
              onClick={handleInstallClick}
              size="lg"
              className="w-full mb-4"
            >
              <Icon name="Download" size={20} className="mr-2" />
              {canInstall ? 'Установить приложение' : 'Инструкция по установке'}
            </Button>

            {showInstructions && (
              <div className="space-y-4 mt-4 pt-4 border-t border-border">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Icon name="Apple" size={18} className="text-foreground" />
                    Для iPhone (iOS):
                  </h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Откройте этот сайт в браузере <strong>Safari</strong></li>
                    <li>Нажмите кнопку "Поделиться" <Icon name="Share" size={14} className="inline" /> (внизу экрана)</li>
                    <li>Выберите "На экран «Домой»"</li>
                    <li>Нажмите "Добавить" — готово! 🎉</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Icon name="Smartphone" size={18} className="text-foreground" />
                    Для Android:
                  </h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Откройте этот сайт в <strong>Chrome</strong></li>
                    <li>Нажмите меню ⋮ (три точки в углу)</li>
                    <li>Выберите "Установить приложение" или "Добавить на главный экран"</li>
                    <li>Подтвердите установку — готово! 🎉</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}