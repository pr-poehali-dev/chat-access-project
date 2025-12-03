import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Message } from './types';

interface ChatMessageProps {
  message: Message;
  depth: number;
  hasReplies: boolean;
  isAdmin: boolean;
  currentUserToken?: string | null;
  availableEmojis: string[];
  searchQuery: string;
  editingMessage: Message | null;
  editContent: string;
  showReactionPicker: number | null;
  isNew: boolean;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onSetEditContent: (content: string) => void;
  onDelete: (msgId: number, replyCount: number) => void;
  onTogglePin: (msgId: number, isPinned: boolean) => void;
  onToggleReaction: (msgId: number, emoji: string, hasReacted: boolean) => void;
  onSetShowReactionPicker: (msgId: number | null) => void;
  onImageClick: (url: string) => void;
  canEdit: (msg: Message) => boolean;
  highlightText: (text: string, query: string) => React.ReactNode;
  replies: Message[];
  renderMessage: (msg: Message, depth: number) => React.ReactNode;
}

export default function ChatMessage({
  message: msg,
  depth,
  hasReplies,
  isAdmin,
  currentUserToken,
  availableEmojis,
  searchQuery,
  editingMessage,
  editContent,
  showReactionPicker,
  isNew,
  onReply,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onSetEditContent,
  onDelete,
  onTogglePin,
  onToggleReaction,
  onSetShowReactionPicker,
  onImageClick,
  canEdit,
  highlightText,
  replies,
  renderMessage
}: ChatMessageProps) {
  const isReply = msg.reply_to !== null && msg.reply_to !== undefined;
  const isAdminMessage = msg.is_admin_message || msg.user_token === 'admin_forever_access_2024' || msg.user_token === 'ADMIN_TOKEN_ValentinaGolosova2024';

  return (
    <div key={msg.id} className="space-y-1.5">
      <div 
        className={`p-2 rounded-lg border transition-all duration-500 ${
          isAdminMessage
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-400 dark:border-amber-600 ring-2 ring-amber-300/50 dark:ring-amber-600/30 shadow-md animate-in fade-in slide-in-from-left-4'
            : msg.is_pinned
            ? 'bg-secondary/20 border-secondary ring-2 ring-secondary/30'
            : isNew
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
            : 'bg-card border-border'
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
            const msgIsAdmin = msg.is_admin_message || msg.user_token === 'admin_forever_access_2024' || msg.user_token === 'ADMIN_TOKEN_ValentinaGolosova2024';
            const displayName = msgIsAdmin ? 'Команда юристов Валентины Голосовой' : msg.author_name;
            const nameHash = msg.author_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const userColors = [
              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
              'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
              'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700',
              'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700',
              'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
            ];
            const colorClass = msgIsAdmin 
              ? 'bg-amber-400 dark:bg-amber-500 text-amber-950 dark:text-amber-950 border-amber-500 dark:border-amber-600 font-semibold shadow-sm'
              : userColors[nameHash % userColors.length];
            
            return (
              <Badge variant="outline" className={`text-[10px] py-0 px-1.5 h-5 ${colorClass}`}>
                <Icon name={msgIsAdmin ? "Crown" : "User"} size={10} className="mr-0.5" />
                {displayName}
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
                onClick={() => onImageClick(url)}
              />
            ))}
          </div>
        )}
        {editingMessage?.id === msg.id ? (
          <div className="space-y-2 mb-2">
            <Textarea
              value={editContent}
              onChange={(e) => onSetEditContent(e.target.value)}
              className="min-h-[60px]"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSaveEdit} className="gap-1">
                <Icon name="Check" size={14} />
                Сохранить
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit} className="gap-1">
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
                  onClick={() => onToggleReaction(msg.id, reaction.emoji, hasReacted)}
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
              onClick={() => onSetShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
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
                        onToggleReaction(msg.id, emoji, hasReacted);
                        onSetShowReactionPicker(null);
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
              onClick={() => onReply(msg)}
            >
              <Icon name="Reply" size={12} />
              <span className="text-[10px]">Ответить</span>
            </Button>
            {canEdit(msg) && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 px-1.5 gap-0.5"
                onClick={() => onEdit(msg)}
              >
                <Icon name="Edit" size={12} />
                <span className="text-[10px]">Редактировать</span>
              </Button>
            )}
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                className={`h-5 px-1.5 gap-0.5 ${msg.is_pinned ? 'text-secondary' : ''}`}
                onClick={() => onTogglePin(msg.id, msg.is_pinned || false)}
              >
                <Icon name={msg.is_pinned ? "PinOff" : "Pin"} size={12} />
                <span className="text-[10px]">{msg.is_pinned ? 'Открепить' : 'Закрепить'}</span>
              </Button>
            )}
            {isAdmin && (
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
                    onDelete(msg.id, replyCount);
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
}