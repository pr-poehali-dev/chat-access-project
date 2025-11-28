import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

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
}

const CHAT_API = 'https://functions.poehali.dev/2143f652-3843-436a-923a-7e36c7c4d228';

export function useChat(
  token: string | null,
  authorName: string,
  activeTab: string,
  subscription: any,
  showNotification: (message: string) => void,
  isAdmin: boolean = false
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const { toast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (token && activeTab === 'chat') {
      loadMessages();
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (activeTab === 'chat' && messages.length > 0) {
      const latestId = messages[0].id;
      localStorage.setItem('lastReadMessageId', latestId.toString());
      setUnreadCount(0);
    }
  }, [activeTab, messages]);

  useEffect(() => {
    if (activeTab === 'chat' && token && (subscription?.is_active || isAdmin)) {
      const interval = setInterval(() => {
        loadMessages(true);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [activeTab, token, subscription?.is_active, isAdmin]);

  useEffect(() => {
    if (token && (subscription?.is_active || isAdmin) && 'serviceWorker' in navigator) {
      const bgInterval = setInterval(() => {
        navigator.serviceWorker.ready.then(registration => {
          registration.active?.postMessage({
            type: 'CHECK_MESSAGES',
            token: token
          });
        });
      }, 15000);
      
      return () => clearInterval(bgInterval);
    }
  }, [token, subscription?.is_active]);

  const loadMessages = async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoading(true);
    const prevLatestId = messages.length > 0 ? messages[0].id : null;
    const lastReadId = parseInt(localStorage.getItem('lastReadMessageId') || '0');
    
    try {
      const res = await fetch(CHAT_API, {
        headers: { 'X-User-Token': token }
      });
      if (res.ok) {
        const data = await res.json();
        const newMessages = data.messages;
        setTypingUsers(data.typing_users || []);
        
        if (silent && prevLatestId !== null && newMessages.length > 0 && newMessages[0].id > prevLatestId) {
          showNotification(newMessages[0].content);
        }
        
        const unread = newMessages.filter((msg: Message) => msg.id > lastReadId).length;
        setUnreadCount(activeTab === 'chat' ? 0 : unread);
        
        setMessages(newMessages);
        
        if (newMessages.length > 0 && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.active?.postMessage({
              type: 'UPDATE_LAST_MESSAGE_ID',
              messageId: newMessages[0].id
            });
          });
        }
      } else if (!silent) {
        // Показываем ошибку только если нет ни подписки, ни прав админа
        if (!subscription?.is_active && !isAdmin) {
          toast({
            title: 'Ошибка доступа',
            description: 'Проверьте статус подписки',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      if (!silent && !isAdmin) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить сообщения',
          variant: 'destructive'
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const sendMessage = async (replyTo?: number, imageUrls?: string[]) => {
    if (!newMessage.trim() && !imageUrls?.length) return;
    if (!token) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token
        },
        body: JSON.stringify({ 
          content: newMessage.trim(),
          author_name: authorName || 'Участник',
          reply_to: replyTo,
          image_urls: imageUrls
        })
      });
      
      if (res.ok) {
        setNewMessage('');
        loadMessages();
      } else {
        const errorData = await res.json();
        toast({
          title: 'Ошибка отправки',
          description: errorData.error || 'Не удалось отправить сообщение',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!token) return;
    
    try {
      const res = await fetch(CHAT_API, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token
        },
        body: JSON.stringify({ message_id: messageId })
      });
      
      if (res.ok) {
        loadMessages();
        toast({
          title: 'Сообщение удалено',
          description: 'Сообщение успешно удалено'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось удалить сообщение',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить сообщение',
        variant: 'destructive'
      });
    }
  };

  const togglePinMessage = async (messageId: number, isPinned: boolean) => {
    if (!token) return;
    
    try {
      const res = await fetch(CHAT_API, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token
        },
        body: JSON.stringify({ 
          message_id: messageId,
          is_pinned: !isPinned
        })
      });
      
      if (res.ok) {
        loadMessages();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось закрепить/открепить сообщение',
        variant: 'destructive'
      });
    }
  };

  const editMessage = async (messageId: number, newContent: string) => {
    if (!token) return;
    
    try {
      const res = await fetch(CHAT_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token
        },
        body: JSON.stringify({ 
          message_id: messageId,
          content: newContent
        })
      });
      
      if (res.ok) {
        loadMessages();
        toast({
          title: 'Сообщение обновлено',
          description: 'Изменения сохранены'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось отредактировать сообщение',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отредактировать сообщение',
        variant: 'destructive'
      });
    }
  };

  const toggleReaction = async (messageId: number, emoji: string, hasReacted: boolean) => {
    if (!token) return;
    
    try {
      const method = hasReacted ? 'DELETE' : 'POST';
      const res = await fetch(`${CHAT_API}/reaction`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token
        },
        body: JSON.stringify({ 
          message_id: messageId,
          emoji: emoji
        })
      });
      
      if (res.ok) {
        loadMessages(true);
      }
    } catch (error) {
      console.error('Failed to toggle reaction');
    }
  };

  const handleTyping = () => {
    if (!token || !subscription?.is_active) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    fetch(`${CHAT_API}/typing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Token': token
      },
      body: JSON.stringify({
        author_name: authorName || 'Участник'
      })
    }).catch(() => {});
    
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 3000);
  };

  return {
    messages,
    newMessage,
    isLoading,
    unreadCount,
    typingUsers,
    setNewMessage,
    sendMessage,
    deleteMessage,
    togglePinMessage,
    editMessage,
    toggleReaction,
    handleTyping,
    loadMessages
  };
}