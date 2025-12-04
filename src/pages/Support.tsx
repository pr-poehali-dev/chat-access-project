import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Message {
  id: number;
  sender_type: 'client' | 'admin';
  sender_email: string;
  message_text: string;
  attachment_url?: string;
  created_at: string;
  reactions: Array<{ reaction: string; user_email: string }>;
}

const SUPPORT_API = 'https://functions.poehali.dev/2f10fbb7-b4a5-4499-be69-1b742ede8f1b';

export default function Support() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email);
      loadMessages(email);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (email: string) => {
    try {
      const response = await fetch(`${SUPPORT_API}?action=get_messages`, {
        headers: {
          'X-User-Email': email,
        },
      });
      const data = await response.json();
      setMessages(data.messages || []);
      setTicketId(data.ticket_id);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userEmail) {
      toast.error('Введите email и сообщение');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(SUPPORT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
        },
        body: JSON.stringify({
          action: 'send_message',
          ticket_id: ticketId,
          message: newMessage,
          sender_type: 'client',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        localStorage.setItem('userEmail', userEmail);
        loadMessages(userEmail);
        toast.success('Сообщение отправлено');
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      toast.error('Не удалось отправить сообщение');
    } finally {
      setLoading(false);
    }
  };

  const addReaction = async (messageId: number, emoji: string) => {
    if (!userEmail) return;

    try {
      await fetch(SUPPORT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
        },
        body: JSON.stringify({
          action: 'add_reaction',
          message_id: messageId,
          reaction: emoji,
        }),
      });
      loadMessages(userEmail);
    } catch (error) {
      console.error('Ошибка добавления реакции:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info('Загрузка файлов будет реализована позже');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <Icon name="ArrowLeft" className="mr-2" size={20} />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Поддержка юристов</h1>
          <p className="text-gray-600 mt-2">
            Задайте вопрос нашим юристам, и мы ответим вам в ближайшее время
          </p>
        </div>

        {!userEmail && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Укажите ваш email</h3>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => userEmail && loadMessages(userEmail)}>
                Продолжить
              </Button>
            </div>
          </Card>
        )}

        {userEmail && (
          <Card className="h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-12">
                  <Icon name="MessageCircle" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Начните диалог с нашими юристами</p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.sender_type === 'client'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.sender_type === 'admin' && (
                      <div className="text-xs font-semibold mb-1 opacity-75">
                        Юрист
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message_text}</p>
                    {msg.attachment_url && (
                      <img
                        src={msg.attachment_url}
                        alt="attachment"
                        className="mt-2 rounded-lg max-w-full"
                      />
                    )}
                    <div className="text-xs opacity-75 mt-2">
                      {new Date(msg.created_at).toLocaleString('ru-RU')}
                    </div>
                    
                    <div className="flex gap-1 mt-2">
                      {['👍', '❤️', '👏'].map((emoji) => {
                        const count = msg.reactions.filter(r => r.reaction === emoji).length;
                        const hasReacted = msg.reactions.some(
                          r => r.reaction === emoji && r.user_email === userEmail
                        );
                        return count > 0 || msg.sender_type === 'admin' ? (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className={`text-sm px-2 py-1 rounded ${
                              hasReacted ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
                            }`}
                          >
                            {emoji} {count > 0 && count}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Icon name="Paperclip" size={20} />
                </Button>
                <Input
                  placeholder="Напишите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
