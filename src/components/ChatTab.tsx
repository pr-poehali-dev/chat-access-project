import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  content: string;
  created_at: string;
  reply_to?: number | null;
}

interface ChatTabProps {
  messages: Message[];
  newMessage: string;
  isLoading: boolean;
  notificationPermission?: NotificationPermission;
  onMessageChange: (value: string) => void;
  onSendMessage: (replyTo?: number) => void;
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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
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
            messages.map(msg => {
              const parentMsg = msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null;
              
              return (
                <div key={msg.id} className="p-3 bg-card rounded-lg border border-border">
                  {parentMsg && (
                    <div className="mb-2 p-2 bg-muted/50 rounded border-l-2 border-primary">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name="CornerDownRight" size={14} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Ответ на:</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{parentMsg.content}</p>
                    </div>
                  )}
                  <p className="text-sm text-foreground mb-2">{msg.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString('ru-RU')}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 gap-1"
                      onClick={() => setReplyingTo(msg)}
                    >
                      <Icon name="Reply" size={14} />
                      <span className="text-xs">Ответить</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {replyingTo && (
          <Card className="p-3 bg-primary/10 border-primary/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Reply" size={14} className="text-primary" />
                  <span className="text-xs font-medium text-primary">Ответ на сообщение:</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{replyingTo.content}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setReplyingTo(null)}
              >
                <Icon name="X" size={14} />
              </Button>
            </div>
          </Card>
        )}

        <div className="flex gap-2">
          <Textarea
            placeholder={replyingTo ? "Напишите ответ..." : "Напишите сообщение..."}
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            className="min-h-[80px]"
            disabled={isLoading}
          />
          <Button
            onClick={() => {
              onSendMessage(replyingTo?.id);
              setReplyingTo(null);
            }}
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