import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface ChatHeaderProps {
  notificationPermission?: NotificationPermission;
  searchQuery: string;
  filteredCount: number;
  onRequestNotifications?: () => void;
  onSearchChange: (value: string) => void;
}

export default function ChatHeader({
  notificationPermission,
  searchQuery,
  filteredCount,
  onRequestNotifications,
  onSearchChange
}: ChatHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="MessageSquare" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold">Закрытый чат участников</h3>
        </div>
        {notificationPermission === 'default' && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onRequestNotifications}
            className="gap-2"
          >
            <Icon name="Bell" size={16} />
            Включить уведомления
          </Button>
        )}
        {notificationPermission === 'granted' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon name="BellRing" size={14} className="text-secondary" />
            Уведомления включены
          </div>
        )}
      </div>

      <div className="relative mb-4">
        <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Поиск сообщений..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Icon name="X" size={18} />
          </button>
        )}
      </div>

      {searchQuery && (
        <div className="text-sm text-muted-foreground mb-2">
          Найдено сообщений: {filteredCount}
        </div>
      )}
    </>
  );
}
