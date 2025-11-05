import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  content: string;
  created_at: string;
}

interface ChatTabProps {
  messages: Message[];
  newMessage: string;
  isLoading: boolean;
  notificationPermission?: NotificationPermission;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onRequestNotifications?: () => void;
}

export default function ChatTab({ 
  messages, 
  newMessage, 
  isLoading,
  notificationPermission,
  onMessageChange, 
  onSendMessage,
  onRequestNotifications
}: ChatTabProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
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

        <div className="space-y-3 max-h-[400px] overflow-y-auto p-4 bg-muted/30 rounded-lg">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Сообщений пока нет. Начните общение!
            </p>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="p-3 bg-card rounded-lg border border-border">
                <p className="text-sm text-foreground mb-1">{msg.content}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleString('ru-RU')}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Напишите сообщение..."
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            className="min-h-[80px]"
            disabled={isLoading}
          />
          <Button
            onClick={onSendMessage}
            disabled={isLoading || !newMessage.trim()}
            className="self-end"
          >
            <Icon name="Send" size={18} />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          💡 Чат обновляется автоматически каждые 10 секунд
        </p>
      </div>
    </Card>
  );
}