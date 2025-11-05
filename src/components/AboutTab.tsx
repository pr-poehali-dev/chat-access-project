import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export default function AboutTab() {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/30 to-primary/20 border-primary">
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
    </div>
  );
}
