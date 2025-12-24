
import React, { useState, useEffect } from 'react';
import { View, Notification } from '../types';
import Header from '../components/Header';
import { supabase } from '../supabaseClient';

interface AlertsProps {
  onNavigate: (view: View) => void;
}

const Alerts: React.FC<AlertsProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications_realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          fetchNotifications(); // Refresh on new notification
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!actor_id(name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: Notification[] = (data || []).map(n => ({
        id: n.id,
        user: n.actor?.name || 'Membro',
        avatar: n.actor?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
        type: n.type as any,
        message: n.message,
        time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: n.read
      }));

      setNotifications(formatted);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const removeNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error removing notification:', err);
    }
  };

  const clearAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const handleFriendAction = (id: string, action: 'accept' | 'decline', e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app, this would trigger an API call to a friends table
    removeNotification(id, e);
  };

  return (
    <div className="flex flex-col pb-24 min-h-screen bg-background-dark">
      <Header
        title="Notificações"
        rightAction={
          notifications.length > 0 ? (
            <button
              onClick={clearAll}
              className="text-xs font-black uppercase tracking-[0.2em] text-primary hover:opacity-70 transition-opacity"
            >
              Limpar tudo
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`flex gap-4 p-5 border-b border-white/5 transition-all cursor-pointer relative group ${!notif.read ? 'bg-primary/10' : 'bg-transparent'}`}
            >
              <div className="relative shrink-0">
                <img src={notif.avatar} className="size-14 rounded-2xl object-cover shadow-2xl" alt="Avatar" />
                <div className={`absolute -bottom-1 -right-1 rounded-xl p-1.5 border-4 border-background-dark ${notif.type === 'FRIEND_REQUEST' ? 'bg-blue-500' :
                    notif.type === 'LIKE' ? 'bg-red-500 shadow-lg shadow-red-500/20' :
                      notif.type === 'COMMENT' ? 'bg-primary shadow-lg shadow-primary/20' :
                        'bg-primary'
                  }`}>
                  <span className="material-symbols-outlined text-[14px] text-white filled flex items-center justify-center">
                    {notif.type === 'FRIEND_REQUEST' ? 'person_add' : notif.type === 'LIKE' ? 'favorite' : 'chat_bubble'}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-1 pr-8">
                <p className="text-sm leading-relaxed text-white">
                  <span className="font-black uppercase tracking-tight text-white">{notif.user}</span>{' '}
                  <span className="opacity-60 text-[13px]">{notif.message}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-primary font-black uppercase tracking-widest">{notif.time}</span>
                  {!notif.read && <span className="size-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.5)]"></span>}
                </div>

                {notif.type === 'FRIEND_REQUEST' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={(e) => handleFriendAction(notif.id, 'accept', e)}
                      className="flex-1 h-10 bg-primary rounded-xl text-black text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                      Aceitar
                    </button>
                    <button
                      onClick={(e) => handleFriendAction(notif.id, 'decline', e)}
                      className="flex-1 h-10 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 active:scale-95 transition-all border border-white/5"
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => removeNotification(notif.id, e)}
                className="absolute top-5 right-5 text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-32 px-10 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="size-24 bg-white/5 rounded-full flex items-center justify-center mb-8 text-white/10 ring-1 ring-white/5">
              <span className="material-symbols-outlined text-5xl">notifications_off</span>
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Tudo limpo por aqui!</h3>
            <p className="text-[11px] text-white/30 uppercase tracking-[0.2em] font-medium max-w-xs mx-auto">
              Você não tem novas notificações no momento.
            </p>
            <button
              onClick={() => onNavigate('FEED')}
              className="mt-10 h-11 px-8 bg-white/5 border border-white/10 rounded-xl text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
            >
              Explorar Feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
