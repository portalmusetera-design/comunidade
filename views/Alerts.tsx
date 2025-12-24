
import React, { useState } from 'react';
import { NOTIFICATIONS as INITIAL_NOTIFICATIONS } from '../constants';
import { View, Notification } from '../types';
import Header from '../components/Header';

interface AlertsProps {
  onNavigate: (view: View) => void;
}

const Alerts: React.FC<AlertsProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleFriendAction = (id: string, action: 'accept' | 'decline', e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app, this would trigger an API call
    console.log(`${action === 'accept' ? 'Aceitou' : 'Recusou'} solicitação ${id}`);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="flex flex-col pb-24 min-h-full">
      <Header
        title="Notificações"
        rightAction={
          notifications.length > 0 ? (
            <button
              onClick={clearAll}
              className="text-xs font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
            >
              Limpar tudo
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-col">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800 transition-all cursor-pointer relative group ${!notif.read ? 'bg-primary/5 dark:bg-primary/10' : 'bg-transparent'}`}
            >
              <div className="relative shrink-0">
                <img src={notif.avatar} className="size-12 rounded-full object-cover shadow-sm" alt="Avatar" />
                <div className={`absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-white dark:border-surface-dark ${notif.type === 'FRIEND_REQUEST' ? 'bg-blue-500' :
                  notif.type === 'LIKE' ? 'bg-red-500' :
                    'bg-primary'
                  }`}>
                  <span className="material-symbols-outlined text-[12px] text-white filled">
                    {notif.type === 'FRIEND_REQUEST' ? 'person_add' : notif.type === 'LIKE' ? 'favorite' : 'chat_bubble'}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-1 pr-6">
                <p className="text-sm leading-snug text-gray-800 dark:text-gray-200">
                  <span className="font-bold text-gray-900 dark:text-white">{notif.user}</span>{' '}
                  <span className="opacity-80">{notif.message}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{notif.time}</span>
                  {!notif.read && <span className="size-1.5 bg-primary rounded-full"></span>}
                </div>

                {notif.type === 'FRIEND_REQUEST' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => handleFriendAction(notif.id, 'accept', e)}
                      className="flex-1 h-9 bg-primary rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                      Aceitar
                    </button>
                    <button
                      onClick={(e) => handleFriendAction(notif.id, 'decline', e)}
                      className="flex-1 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 active:scale-95 transition-all"
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </div>

              {/* Delete single notification button */}
              <button
                onClick={(e) => removeNotification(notif.id, e)}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-10 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="size-20 bg-gray-100 dark:bg-surface-dark rounded-full flex items-center justify-center mb-6 text-gray-300">
              <span className="material-symbols-outlined text-4xl">notifications_off</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Tudo limpo por aqui!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Você não tem novas notificações no momento. Quando algo acontecer, avisaremos você!
            </p>
            <button
              onClick={() => onNavigate('FEED')}
              className="mt-8 text-primary font-bold text-sm hover:underline"
            >
              Voltar para o início
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
