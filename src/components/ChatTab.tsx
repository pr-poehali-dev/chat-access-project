import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Reaction {
  emoji: string;
  count: number;
}

interface TypingUser {
  user_token: string;
  author_name?: string | null;
}

interface Message {
  id: number;
  content: string;
  image_url?: string | null;
  image_urls?: string[];
  author_name?: string | null;
  created_at: string;
  reply_to?: number | null;
  user_token?: string | null;
  email?: string | null;
  is_pinned?: boolean;
  edited_at?: string | null;
  reactions?: Reaction[];
  user_reactions?: string[];
  admin_reacted?: boolean;
}

interface ChatTabProps {
  messages: Message[];
  newMessage: string;
  isLoading: boolean;
  notificationPermission?: NotificationPermission;
  isAdmin?: boolean;
  currentUserToken?: string | null;
  typingUsers?: TypingUser[];
  onMessageChange: (value: string) => void;
  onSendMessage: (replyTo?: number, imageUrls?: string[]) => void;
  onRequestNotifications?: () => void;
  onDeleteMessage?: (messageId: number) => void;
  onTogglePinMessage?: (messageId: number, isPinned: boolean) => void;
  onEditMessage?: (messageId: number, newContent: string) => void;
  onToggleReaction?: (messageId: number, emoji: string, hasReacted: boolean) => void;
  onTyping?: () => void;
}

export default function ChatTab({ 
  messages, 
  newMessage, 
  isLoading,
  notificationPermission,
  isAdmin = false,
  currentUserToken,
  typingUsers = [],
  onMessageChange, 
  onSendMessage,
  onRequestNotifications,
  onDeleteMessage,
  onTogglePinMessage,
  onEditMessage,
  onToggleReaction,
  onTyping
}: ChatTabProps) {
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const availableEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...imageFiles]);
      
      imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSend = async () => {
    onSendMessage(replyingTo?.id, imagePreviews.length > 0 ? imagePreviews : undefined);
    setReplyingTo(null);
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const clearImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (msg: Message) => {
    setEditingMessage(msg);
    setEditContent(msg.content);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const saveEdit = () => {
    if (editingMessage && onEditMessage && editContent.trim()) {
      onEditMessage(editingMessage.id, editContent.trim());
      cancelEdit();
    }
  };

  const canEdit = (msg: Message) => {
    if (!currentUserToken || msg.user_token !== currentUserToken) return false;
    const createdAt = new Date(msg.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;
    return diffMinutes <= 5;
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? 
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded">{part}</mark> : 
        part
    );
  };

  const filteredMessages = searchQuery.trim() 
    ? messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;
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

        <div className="relative mb-4">
          <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск сообщений..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Icon name="X" size={18} />
            </button>
          )}
        </div>

        {searchQuery && (
          <div className="text-sm text-muted-foreground mb-2">
            Найдено сообщений: {filteredMessages.length}
          </div>
        )}

        <div className="space-y-2 max-h-[600px] overflow-y-auto p-3 bg-muted/30 rounded-lg">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Сообщений пока нет. Начните общение!
            </p>
          ) : (
            (() => {
              const displayMessages = searchQuery.trim() ? filteredMessages : messages;
              const topLevelMessages = displayMessages.filter(m => !m.reply_to);
              const renderMessage = (msg: Message, depth: number = 0) => {
                const replies = displayMessages.filter(m => m.reply_to === msg.id);
                const hasReplies = replies.length > 0;
                const isReply = msg.reply_to !== null && msg.reply_to !== undefined;
                
                return (
                  <div key={msg.id} className="space-y-1.5">
                    <div 
                      className={`p-2 rounded-lg border transition-colors ${
                        msg.is_pinned
                          ? 'bg-secondary/20 border-secondary ring-2 ring-secondary/30'
                          : hasReplies || isReply || msg.admin_reacted
                          ? 'bg-card border-border' 
                          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                      }`}
                      style={{ marginLeft: `${depth * 20}px` }}
                    >
                      <div className="mb-1.5 flex items-center gap-1.5 flex-wrap">
                        {msg.is_pinned && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-5 bg-secondary text-secondary-foreground">
                            <Icon name="Pin" size={10} className="mr-0.5" />
                            Закреплено
                          </Badge>
                        )}
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
                            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 h-5 ${colorClass}`}>
                              <Icon name={isAdminMessage ? "Crown" : "User"} size={10} className="mr-0.5" />
                              {msg.author_name}
                            </Badge>
                          );
                        })()}
                        {isAdmin && msg.email && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-5">
                            <Icon name="Mail" size={10} className="mr-0.5" />
                            {msg.email || msg.user_token?.substring(0, 8)}
                          </Badge>
                        )}
                        {msg.edited_at && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 text-muted-foreground">
                            <Icon name="Edit" size={10} className="mr-0.5" />
                            изменено
                          </Badge>
                        )}
                      </div>
                      {(msg.image_urls && msg.image_urls.length > 0) && (
                        <div className={`mb-2 gap-2 ${msg.image_urls.length === 1 ? 'flex' : 'grid grid-cols-2'}`}>
                          {msg.image_urls.map((url, idx) => (
                            <img 
                              key={idx}
                              src={url} 
                              alt={`Attached ${idx + 1}`}
                              className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setFullscreenImage(url)}
                            />
                          ))}
                        </div>
                      )}
                      {editingMessage?.id === msg.id ? (
                        <div className="space-y-2 mb-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px]"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit} className="gap-1">
                              <Icon name="Check" size={14} />
                              Сохранить
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1">
                              <Icon name="X" size={14} />
                              Отмена
                            </Button>
                          </div>
                        </div>
                      ) : (
                        msg.content && <p className="text-xs leading-relaxed text-foreground mb-1.5">{highlightText(msg.content, searchQuery)}</p>
                      )}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mb-1.5">
                          {msg.reactions.map((reaction, idx) => {
                            const hasReacted = msg.user_reactions?.includes(reaction.emoji);
                            return (
                              <button
                                key={idx}
                                className={`h-6 px-2 rounded-full flex items-center gap-1 text-xs transition-all hover:scale-105 ${
                                  hasReacted 
                                    ? 'bg-primary/10 border border-primary/30 shadow-sm' 
                                    : 'bg-muted/50 border border-border/50 hover:bg-muted'
                                }`}
                                onClick={() => onToggleReaction?.(msg.id, reaction.emoji, hasReacted)}
                              >
                                <span className="text-sm">{reaction.emoji}</span>
                                <span className="text-[10px] font-medium text-muted-foreground">{reaction.count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString('ru-RU')}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap relative">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 px-1.5 gap-0.5"
                            onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                          >
                            <Icon name="Smile" size={12} />
                            <span className="text-[10px]">Реакция</span>
                          </Button>
                          {showReactionPicker === msg.id && (
                            <div className="absolute bottom-full mb-1 left-0 bg-card border rounded-lg shadow-lg p-2 flex gap-1 z-10">
                              {availableEmojis.map((emoji) => {
                                const hasReacted = msg.user_reactions?.includes(emoji);
                                return (
                                  <Button
                                    key={emoji}
                                    size="sm"
                                    variant={hasReacted ? "secondary" : "ghost"}
                                    className="h-8 w-8 p-0 text-lg hover:scale-110 transition-transform"
                                    onClick={() => {
                                      onToggleReaction?.(msg.id, emoji, hasReacted);
                                      setShowReactionPicker(null);
                                    }}
                                  >
                                    {emoji}
                                  </Button>
                                );
                              })}
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 px-1.5 gap-0.5"
                            onClick={() => setReplyingTo(msg)}
                          >
                            <Icon name="Reply" size={12} />
                            <span className="text-[10px]">Ответить</span>
                          </Button>
                          {canEdit(msg) && onEditMessage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-1.5 gap-0.5"
                              onClick={() => startEdit(msg)}
                            >
                              <Icon name="Edit" size={12} />
                              <span className="text-[10px]">Редактировать</span>
                            </Button>
                          )}
                          {isAdmin && onTogglePinMessage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-5 px-1.5 gap-0.5 ${msg.is_pinned ? 'text-secondary' : ''}`}
                              onClick={() => onTogglePinMessage(msg.id, msg.is_pinned || false)}
                            >
                              <Icon name={msg.is_pinned ? "PinOff" : "Pin"} size={12} />
                              <span className="text-[10px]">{msg.is_pinned ? 'Открепить' : 'Закрепить'}</span>
                            </Button>
                          )}
                          {isAdmin && onDeleteMessage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-1.5 gap-0.5 text-destructive hover:text-destructive"
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
                              <Icon name="Trash2" size={12} />
                              <span className="text-[10px]">Удалить</span>
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
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 animate-pulse">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {typingUsers.map(u => u.author_name || 'Участник').join(', ')} {typingUsers.length === 1 ? 'печатает' : 'печатают'}...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {imagePreviews.length > 0 && (
          <Card className="p-3 bg-secondary/10 border-secondary/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Изображения ({imagePreviews.length})</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAllImages}
                className="h-6 px-2 gap-1"
              >
                <Icon name="X" size={12} />
                <span className="text-xs">Очистить все</span>
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={preview} 
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-20 rounded object-cover"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => clearImage(idx)}
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-destructive/80 hover:bg-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="X" size={12} className="text-white" />
                  </Button>
                </div>
              ))}
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
              onChange={(e) => {
                onMessageChange(e.target.value);
                onTyping?.();
              }}
              className="min-h-[80px]"
              disabled={isLoading}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
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
              disabled={isLoading || (!newMessage.trim() && selectedImages.length === 0)}
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