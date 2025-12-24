
import React, { useState, useEffect } from 'react';
import { View, Chat } from '../types';
import Header from '../components/Header';
import { supabase } from '../supabaseClient';
import ChatWindow from './ChatWindow';

interface ChatListProps {
  onNavigate: (view: View) => void;
}

const ChatList: React.FC<ChatListProps> = ({ onNavigate }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch chats where the user is a participant
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chat:chats(id, created_at),
          participants:chat_participants(
            user_id,
            profile:profiles!user_id(name, avatar_url)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedChats: Chat[] = (data || []).map((item: any) => {
        const otherParticipants = item.participants
          .filter((p: any) => p.user_id !== user.id)
          .map((p: any) => ({
            user_id: p.user_id,
            name: p.profile?.name || 'Membro',
            avatar_url: p.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80'
          }));

        return {
          id: item.chat_id,
          participants: otherParticipants,
          lastMessage: 'Abrir conversa',
          lastMessageTime: '',
          unreadCount: 0
        };
      });

      setChats(formattedChats);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .ilike('name', `%${query}%`)
        .neq('id', user?.id)
        .limit(5);

      if (data) setSearchResults(data);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const startChat = async (otherUser: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if chat already exists
      // This is a simplified check, ideally server-side or more robust
      const { data: existingChats } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      const { data: otherUserChats } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', otherUser.id);

      const chatIds1 = new Set(existingChats?.map(c => c.chat_id));
      const commonChat = otherUserChats?.find(c => chatIds1.has(c.chat_id));

      if (commonChat) {
        const chat = chats.find(c => c.id === commonChat.chat_id) || {
          id: commonChat.chat_id,
          participants: [{ user_id: otherUser.id, name: otherUser.name, avatar_url: otherUser.avatar_url }]
        };
        setSelectedChat(chat as Chat);
      } else {
        // Create new chat
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({})
          .select()
          .single();

        if (chatError) throw chatError;

        await supabase.from('chat_participants').insert([
          { chat_id: newChat.id, user_id: user.id },
          { chat_id: newChat.id, user_id: otherUser.id }
        ]);

        const chat = {
          id: newChat.id,
          participants: [{ user_id: otherUser.id, name: otherUser.name, avatar_url: otherUser.avatar_url }]
        };
        setSelectedChat(chat as Chat);
        fetchChats();
      }
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  if (selectedChat) {
    return <ChatWindow chat={selectedChat} onBack={() => { setSelectedChat(null); fetchChats(); }} />;
  }

  return (
    <div className="flex flex-col pb-24 bg-background-dark min-h-screen">
      <Header
        title="Conversas"
        rightAction={
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-full transition-colors ${showSearch ? 'bg-primary text-black' : 'text-primary hover:bg-primary/10'}`}
          >
            <span className="material-symbols-outlined">{showSearch ? 'close' : 'edit_square'}</span>
          </button>
        }
      />

      <div className="flex flex-col">
        {showSearch && (
          <div className="px-4 py-4 border-b border-white/5 bg-white/5 animate-in slide-in-from-top-4 duration-300">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/20">search</span>
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                placeholder="Buscar membros para conversar..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => startChat(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                >
                  <img src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80'} className="size-10 rounded-full object-cover" alt={user.name} />
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{user.name}</h5>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-black">Membro Terapeuta</span>
                  </div>
                  <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-all">send</span>
                </button>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-center py-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Nenhum usuário encontrado</p>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className="flex items-center gap-4 px-4 py-5 hover:bg-white/5 border-b border-white/5 transition-all text-left group"
            >
              <div className="relative shrink-0">
                <img src={chat.participants[0]?.avatar_url} className="size-14 rounded-2xl object-cover shadow-2xl group-hover:scale-105 transition-transform" alt="Avatar" />
                <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 rounded-full border-[3px] border-background-dark"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="font-bold text-base truncate text-white group-hover:text-primary transition-colors">{chat.participants[0]?.name}</h4>
                  <span className="text-[10px] text-white/30">{chat.lastMessageTime}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className="text-sm text-white/50 truncate font-medium">{chat.lastMessage}</p>
                  {(chat.unreadCount || 0) > 0 && <span className="bg-primary text-black text-[10px] font-black px-1.5 py-0.5 rounded-lg min-w-[18px] text-center">{chat.unreadCount}</span>}
                </div>
              </div>
            </button>
          ))
        )}

        {!loading && chats.length === 0 && !showSearch && (
          <div className="flex flex-col items-center justify-center py-32 px-10 text-center opacity-20">
            <span className="material-symbols-outlined text-6xl mb-4">forum</span>
            <p className="text-xs font-black uppercase tracking-[0.3em]">Nenhuma conversa ativa</p>
            <p className="text-[10px] mt-2 font-medium">Inicie uma nova conversa clicando no botão acima.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
