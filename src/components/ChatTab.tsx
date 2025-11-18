import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import ChatHeader from './chat/ChatHeader';
import ChatMessage from './chat/ChatMessage';
import ChatMessageInput from './chat/ChatMessageInput';
import { Message, TypingUser } from './chat/types';

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
        <ChatHeader
          notificationPermission={notificationPermission}
          searchQuery={searchQuery}
          filteredCount={filteredMessages.length}
          onRequestNotifications={onRequestNotifications}
          onSearchChange={setSearchQuery}
        />

        <div className="space-y-2 max-h-[600px] overflow-y-auto p-3 bg-muted/30 rounded-lg">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Сообщений пока нет. Начните общение!
            </p>
          ) : (
            (() => {
              const displayMessages = searchQuery.trim() ? filteredMessages : messages;
              const topLevelMessages = displayMessages.filter(m => !m.reply_to);
              const renderMessage = (msg: Message, depth: number = 0): React.ReactNode => {
                const replies = displayMessages.filter(m => m.reply_to === msg.id);
                const hasReplies = replies.length > 0;
                
                return (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    depth={depth}
                    hasReplies={hasReplies}
                    isAdmin={isAdmin}
                    currentUserToken={currentUserToken}
                    availableEmojis={availableEmojis}
                    searchQuery={searchQuery}
                    editingMessage={editingMessage}
                    editContent={editContent}
                    showReactionPicker={showReactionPicker}
                    onReply={setReplyingTo}
                    onEdit={startEdit}
                    onCancelEdit={cancelEdit}
                    onSaveEdit={saveEdit}
                    onSetEditContent={setEditContent}
                    onDelete={onDeleteMessage!}
                    onTogglePin={onTogglePinMessage!}
                    onToggleReaction={onToggleReaction!}
                    onSetShowReactionPicker={setShowReactionPicker}
                    onImageClick={setFullscreenImage}
                    canEdit={canEdit}
                    highlightText={highlightText}
                    replies={replies}
                    renderMessage={renderMessage}
                  />
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

        <ChatMessageInput
          newMessage={newMessage}
          isLoading={isLoading}
          replyingTo={replyingTo}
          imagePreviews={imagePreviews}
          onMessageChange={onMessageChange}
          onSend={handleSend}
          onCancelReply={() => setReplyingTo(null)}
          onImageSelect={handleImageSelect}
          onClearImage={clearImage}
          onClearAllImages={clearAllImages}
          onTyping={onTyping}
          fileInputRef={fileInputRef}
        />
      </div>

      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setFullscreenImage(null)}
          >
            <Icon name="X" size={32} />
          </button>
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
