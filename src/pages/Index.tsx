import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import AboutTab from '@/components/AboutTab';
import ChatTab from '@/components/ChatTab';
import SubscriptionTab from '@/components/SubscriptionTab';
import RulesTab from '@/components/RulesTab';
import SupportTab from '@/components/SupportTab';
import AdminPanel from '@/components/AdminPanel';
import AppHeader from '@/components/AppHeader';
import AuthDialogs from '@/components/AuthDialogs';
import InstallDialog from '@/components/InstallDialog';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useChat } from '@/hooks/useChat';

export default function Index() {
  const [activeTab, setActiveTab] = useState('about');
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const { toast } = useToast();

  const {
    token,
    isAdmin,
    authorName,
    subscription,
    showAdminDialog,
    showTokenDialog,
    showNameDialog,
    setShowAdminDialog,
    setShowTokenDialog,
    setShowNameDialog,
    handleLogin,
    handleLogout,
    handleNameSave,
    loadSubscription
  } = useAppAuth();

  const {
    notificationPermission,
    requestNotificationPermission,
    showNotification
  } = useNotifications();

  const {
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
    handleTyping
  } = useChat(token, authorName, activeTab, subscription, showNotification);

  console.log('isAdmin state:', isAdmin, 'localStorage isAdmin:', localStorage.getItem('isAdmin'));

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log('Service Worker registered'))
        .catch((err) => console.error('Service Worker registration failed:', err));
    }

    const hasSeenInstallPrompt = localStorage.getItem('hasSeenInstallPrompt');
    if (!hasSeenInstallPrompt) {
      localStorage.setItem('hasSeenInstallPrompt', 'true');
      setTimeout(() => {
        setShowInstallDialog(true);
      }, 3000);
    }
  }, []);

  useEffect(() => {
    if (token && activeTab === 'chat') {
      const hasPromptedName = sessionStorage.getItem('hasPromptedNameDialog');
      if (!authorName && !hasPromptedName) {
        setTimeout(() => {
          setShowNameDialog(true);
          sessionStorage.setItem('hasPromptedNameDialog', 'true');
        }, 1000);
      }
    }
  }, [token, activeTab, authorName]);

  useEffect(() => {
    if (subscription) {
      const hasAutoSwitched = sessionStorage.getItem('hasAutoSwitchedToChat');
      if (subscription.is_active && activeTab === 'about' && !hasAutoSwitched) {
        setActiveTab('chat');
        sessionStorage.setItem('hasAutoSwitchedToChat', 'true');
      }
    }
  }, [subscription, activeTab]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        token={token} 
        isAdmin={isAdmin}
        onLoginClick={() => setShowTokenDialog(true)}
        onAdminClick={() => setShowAdminDialog(true)}
        onLogout={handleLogout}
        onInstallClick={() => setShowInstallDialog(true)}
      />

      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`grid w-full ${subscription?.is_active || isAdmin ? 'grid-cols-5' : 'grid-cols-4'} mb-6`}>
              <TabsTrigger value="about" className="gap-2">
                <Icon name="Info" size={16} />
                О проекте
              </TabsTrigger>
              {(subscription?.is_active || isAdmin) && (
                <TabsTrigger value="chat" className="gap-2 relative">
                  <Icon name="MessageSquare" size={16} />
                  Чат
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="subscription" className="gap-2">
                <Icon name="CreditCard" size={16} />
                Подписка
              </TabsTrigger>
              <TabsTrigger value="rules" className="gap-2">
                <Icon name="FileText" size={16} />
                Правила
              </TabsTrigger>
              <TabsTrigger value="support" className="gap-2">
                <Icon name="HelpCircle" size={16} />
                Поддержка
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <AboutTab 
                hasActiveSubscription={subscription?.is_active || isAdmin}
                onSubscriptionClick={() => setActiveTab('subscription')}
              />
            </TabsContent>

            {(subscription?.is_active || isAdmin) && (
              <TabsContent value="chat">
                <ChatTab
                  messages={messages}
                  newMessage={newMessage}
                  isLoading={isLoading}
                  notificationPermission={notificationPermission}
                  isAdmin={isAdmin}
                  currentUserToken={token}
                  typingUsers={typingUsers}
                  onMessageChange={setNewMessage}
                  onSendMessage={sendMessage}
                  onRequestNotifications={requestNotificationPermission}
                  onDeleteMessage={deleteMessage}
                  onTogglePinMessage={togglePinMessage}
                  onEditMessage={editMessage}
                  onToggleReaction={toggleReaction}
                  onTyping={handleTyping}
                />
              </TabsContent>
            )}

            <TabsContent value="subscription">
              <SubscriptionTab 
                token={token} 
                subscription={subscription}
                onSubscriptionUpdate={loadSubscription}
              />
            </TabsContent>

            <TabsContent value="rules">
              <RulesTab />
            </TabsContent>

            <TabsContent value="support">
              <SupportTab />
            </TabsContent>
          </Tabs>

          {isAdmin && (
            <div className="mt-6">
              <AdminPanel token={token} />
            </div>
          )}
        </div>
      </div>

      <AuthDialogs
        showAdminDialog={showAdminDialog}
        showTokenDialog={showTokenDialog}
        showNameDialog={showNameDialog}
        authorName={authorName}
        onAdminClose={() => setShowAdminDialog(false)}
        onTokenClose={() => setShowTokenDialog(false)}
        onNameClose={() => setShowNameDialog(false)}
        onAdminLogin={handleLogin}
        onTokenLogin={handleLogin}
        onNameSave={handleNameSave}
      />

      <InstallDialog 
        open={showInstallDialog}
        onOpenChange={setShowInstallDialog}
      />
    </div>
  );
}