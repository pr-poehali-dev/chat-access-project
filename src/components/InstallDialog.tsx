import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface InstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InstallDialog({ open, onOpenChange }: InstallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Icon name="Smartphone" size={24} className="text-primary" />
            Установите приложение на телефон
          </DialogTitle>
          <DialogDescription>
            Установите приложение для быстрого доступа и работы офлайн
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon name="Apple" size={20} className="text-foreground" />
              Для iPhone (iOS):
            </h4>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground pl-2">
              <li>Откройте этот сайт в браузере <strong className="text-foreground">Safari</strong></li>
              <li>Нажмите кнопку <strong className="text-foreground">"Поделиться"</strong> <Icon name="Share" size={14} className="inline" /> (внизу экрана)</li>
              <li>Прокрутите вниз и выберите <strong className="text-foreground">"На экран «Домой»"</strong></li>
              <li>Нажмите <strong className="text-foreground">"Добавить"</strong> — готово! 🎉</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon name="Smartphone" size={20} className="text-foreground" />
              Для Android:
            </h4>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground pl-2">
              <li>Откройте этот сайт в <strong className="text-foreground">Chrome</strong></li>
              <li>Нажмите меню <strong className="text-foreground">⋮</strong> (три точки в правом верхнем углу)</li>
              <li>Выберите <strong className="text-foreground">"Установить приложение"</strong> или <strong className="text-foreground">"Добавить на главный экран"</strong></li>
              <li>Подтвердите установку — готово! 🎉</li>
            </ol>
          </div>

          <Card className="p-4 bg-primary/10 border-primary/20">
            <div className="flex items-start gap-3">
              <Icon name="Zap" size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-2">Преимущества установки:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Быстрый доступ с главного экрана</li>
                  <li>✓ Работает без интернета</li>
                  <li>✓ Push-уведомления о новых сообщениях</li>
                  <li>✓ Полноэкранный режим без браузерных элементов</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
