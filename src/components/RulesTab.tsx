import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export default function RulesTab() {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon name="FileText" size={20} className="text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Правила закрытого сообщества</h3>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">
              <span className="font-semibold text-secondary text-sm">1</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Уважение к участникам</h4>
              <p className="text-sm text-muted-foreground">
                Общайтесь вежливо, избегайте оскорблений и грубости. Помните, что все находятся в похожей ситуации и нуждаются в поддержке.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">
              <span className="font-semibold text-secondary text-sm">2</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Конфиденциальность</h4>
              <p className="text-sm text-muted-foreground">
                Не разглашайте личную информацию других участников за пределами чата. Все обсуждения остаются внутри сообщества.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">
              <span className="font-semibold text-secondary text-sm">3</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Запрещено</h4>
              <p className="text-sm text-muted-foreground">
                Реклама, спам, продажа товаров/услуг, политические и религиозные споры. Чат создан исключительно для помощи в вопросах банкротства.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">
              <span className="font-semibold text-secondary text-sm">4</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Формат общения</h4>
              <p className="text-sm text-muted-foreground">
                Формулируйте вопросы четко, делитесь своим опытом конструктивно. Чем понятнее вопрос, тем проще вам помочь.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">
              <span className="font-semibold text-secondary text-sm">5</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Юридическая ответственность</h4>
              <p className="text-sm text-muted-foreground">
                Вся информация носит рекомендательный характер. Окончательные решения принимайте самостоятельно или консультируйтесь с юристами.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">
              <span className="font-semibold text-secondary text-sm">6</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Активная помощь</h4>
              <p className="text-sm text-muted-foreground">
                Поддерживайте других участников, делитесь опытом. Вместе проходить процедуру легче!
              </p>
            </div>
          </div>
        </div>

        <Card className="p-4 bg-destructive/10 border-destructive/30">
          <div className="flex gap-3">
            <Icon name="AlertTriangle" size={20} className="text-destructive shrink-0" />
            <div>
              <h4 className="font-semibold mb-1 text-destructive">Нарушение правил</h4>
              <p className="text-sm text-muted-foreground">
                За нарушение правил доступ к чату может быть ограничен без возврата средств
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-secondary/10 border-secondary/30">
          <div className="flex gap-3">
            <Icon name="Heart" size={20} className="text-secondary shrink-0" />
            <div>
              <p className="text-sm">
                Мы создали это сообщество, чтобы каждый мог получить поддержку и пройти процедуру банкротства успешно. Давайте помогать друг другу!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
}
