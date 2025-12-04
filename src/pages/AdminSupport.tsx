import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Ticket {
  id: number;
  client_email: string;
  client_name?: string;
  status: 'open' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  message_count: number;
}

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

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const email = localStorage.getItem('adminEmail') || 'admin@bankrot-kurs.ru';
    setAdminEmail(email);
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket);
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTickets = async () => {
    try {
      const response = await fetch(`${SUPPORT_API}?action=get_tickets`);
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Ошибка загрузки тикетов:', error);
    }
  };

  const loadMessages = async (ticketId: number) => {
    try {
      const response = await fetch(`${SUPPORT_API}?action=get_messages&ticket_id=${ticketId}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setLoading(true);
    try {
      const response = await fetch(SUPPORT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': adminEmail,
        },
        body: JSON.stringify({
          action: 'send_message',
          ticket_id: selectedTicket,
          message: newMessage,
          sender_type: 'admin',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        loadMessages(selectedTicket);
        loadTickets();
        toast.success('Ответ отправлен клиенту');
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      toast.error('Не удалось отправить ответ');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: number, status: string) => {
    try {
      await fetch(SUPPORT_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          status,
        }),
      });
      loadTickets();
      toast.success(`Тикет отмечен как "${status}"`);
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      open: 'default',
      pending: 'secondary',
      closed: 'destructive',
    };
    const labels: Record<string, string> = {
      open: 'Открыт',
      pending: 'В работе',
      closed: 'Закрыт',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const selectedTicketData = tickets.find(t => t.id === selectedTicket);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="flex h-screen">
        <div className="w-96 border-r border-gray-700 bg-gray-800/50 flex flex-col">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold mb-2">Админ-панель поддержки</h1>
            <p className="text-gray-400 text-sm">Управление обращениями клиентов</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {tickets.length === 0 && (
              <div className="text-center text-gray-500 mt-12">
                <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Нет обращений</p>
              </div>
            )}

            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                  selectedTicket === ticket.id
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                }`}
                onClick={() => setSelectedTicket(ticket.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-semibold truncate">{ticket.client_email}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(ticket.created_at).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>{ticket.message_count} сообщений</span>
                  {ticket.last_message_at && (
                    <span className="text-xs">
                      {new Date(ticket.last_message_at).toLocaleTimeString('ru-RU')}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Icon name="MessageSquare" size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-xl">Выберите тикет для просмотра</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-700 bg-gray-800/50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedTicketData?.client_email}</h2>
                    <p className="text-sm text-gray-400">
                      Тикет #{selectedTicket} • {getStatusBadge(selectedTicketData?.status || 'open')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateTicketStatus(selectedTicket, 'pending')}
                    >
                      В работе
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateTicketStatus(selectedTicket, 'closed')}
                    >
                      Закрыть
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-900/50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender_type === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      {msg.sender_type === 'client' && (
                        <div className="text-xs font-semibold mb-1 opacity-75">
                          {msg.sender_email}
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
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-700 p-4 bg-gray-800/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ответить клиенту..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="flex-1 bg-gray-700 border-gray-600 text-white"
                  />
                  <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
                    <Icon name="Send" size={20} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
