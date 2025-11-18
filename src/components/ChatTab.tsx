import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  content: string;
  image_url?: string | null;
  author_name?: string | null;
  created_at: string;
  reply_to?: number | null;
  user_token?: string | null;
  email?: string | null;
}

interface ChatTabProps {
  messages: Message[];
  newMessage: string;
  isLoading: boolean;
  notificationPermission?: NotificationPermission;
  isAdmin?: boolean;
  onMessageChange: (value: string) => void;
  onSendMessage: (replyTo?: number, imageUrl?: string) => void;
  onRequestNotifications?: () => void;
  onDeleteMessage?: (messageId: number) => void;
}

export default function ChatTab({ 
  messages, 
  newMessage, 
  isLoading,
  notificationPermission,
  isAdmin = false,
  onMessageChange, 
  onSendMessage,
  onRequestNotifications,
  onDeleteMessage
}: ChatTabProps) {
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    onSendMessage(replyingTo?.id, imagePreview || undefined);
    setReplyingTo(null);
    setSelectedImage(null);
    setImagePreview('');
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
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
            (() => {
              const topLevelMessages = messages.filter(m => !m.reply_to);
              const renderMessage = (msg: Message, depth: number = 0) => {
                const replies = messages.filter(m => m.reply_to === msg.id);
                const hasReplies = replies.length > 0;
                const isReply = msg.reply_to !== null && msg.reply_to !== undefined;
                
                return (
                  <div key={msg.id} className="space-y-2">
                    <div 
                      className={`p-3 rounded-lg border transition-colors ${
                        hasReplies || isReply
                          ? 'bg-card border-border' 
                          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                      }`}
                      style={{ marginLeft: `${depth * 24}px` }}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        {msg.author_name && (() => {
                          const isAdminMessage = msg.user_token === 'admin_forever_access_2024' || msg.user_token === 'ADMIN_TOKEN_ValentinaGolosova2024';
                          const nameHash = msg.author_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                          const userColors = [
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
                            'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
                            'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700',
                            'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700',
                            'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                          ];
                          const colorClass = isAdminMessage 
                            ? 'bg-amber-400 dark:bg-amber-500 text-amber-950 dark:text-amber-950 border-amber-500 dark:border-amber-600 font-semibold shadow-sm'
                            : userColors[nameHash % userColors.length];
                          
                          return (
                            <Badge variant="outline" className={`text-xs ${colorClass}`}>
                              <Icon name={isAdminMessage ? "Crown" : "User"} size={12} className="mr-1" />
                              {msg.author_name}
                            </Badge>
                          );
                        })()}
                        {isAdmin && msg.email && (
                          <Badge variant="secondary" className="text-xs">
                            <Icon name="Mail" size={12} className="mr-1" />
                            {msg.email || msg.user_token?.substring(0, 8)}
                          </Badge>
                        )}
                      </div>
                      {msg.image_url && (
                        <img 
                          src={msg.image_url} 
                          alt="Attached" 
                          className="max-w-full max-h-64 rounded-lg mb-2 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setFullscreenImage(msg.image_url!)}
                        />
                      )}
                      {msg.content && <p className="text-sm text-foreground mb-2">{msg.content}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString('ru-RU')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 gap-1"
                            onClick={() => setReplyingTo(msg)}
                          >
                            <Icon name="Reply" size={14} />
                            <span className="text-xs">Ответить</span>
                          </Button>
                          {isAdmin && onDeleteMessage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 gap-1 text-destructive hover:text-destructive"
                              onClick={() => {
                                const replyCount = replies.length;
                                const confirmMsg = replyCount > 0 
                                  ? `Удалить это сообщение и все ${replyCount} ответов под ним?`
                                  : 'Удалить это сообщение?';
                                if (confirm(confirmMsg)) {
                                  onDeleteMessage(msg.id);
                                }
                              }}
                            >
                              <Icon name="Trash2" size={14} />
                              <span className="text-xs">Удалить</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {replies.map(reply => renderMessage(reply, depth + 1))}
                  </div>
                );
              };
              
              return topLevelMessages.slice().reverse().map(msg => renderMessage(msg, 0));
            })()
          )}
          <div ref={messagesEndRef} />
        </div>

        {imagePreview && (
          <Card className="p-3 bg-secondary/10 border-secondary/30">
            <div className="flex items-start gap-3">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-20 h-20 rounded object-cover"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={clearImage}
                className="ml-auto"
              >
                <Icon name="X" size={14} />
              </Button>
            </div>
          </Card>
        )}

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
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder={replyingTo ? "Напишите ответ..." : "Напишите сообщение..."}
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              className="min-h-[80px]"
              disabled={isLoading}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              variant="outline"
              size="icon"
            >
              <Icon name="ImagePlus" size={18} />
            </Button>
            <Button
              onClick={handleSend}
              disabled={isLoading || (!newMessage.trim() && !selectedImage)}
              className="flex-1"
            >
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          💡 Чат обновляется автоматически каждые 10 секунд
        </p>
      </div>

      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setFullscreenImage(null)}
          >
            <Icon name="X" size={24} />
          </Button>
          <img 
            src={fullscreenImage} 
            alt="Fullscreen" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Card>
  );
}