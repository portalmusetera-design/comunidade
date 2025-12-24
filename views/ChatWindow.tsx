
import React, { useState, useEffect, useRef } from 'react';
import { Chat, Message } from '../types';
import { supabase } from '../supabaseClient';

interface ChatWindowProps {
    chat: Chat;
    onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onBack }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const otherParticipant = chat.participants[0];

    useEffect(() => {
        fetchMessages();

        // Subscribe to new messages in this chat
        const channel = supabase
            .channel(`chat:${chat.id}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chat.id}` },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chat.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chat.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('messages')
                .insert({
                    chat_id: chat.id,
                    sender_id: user.id,
                    content: newMessage.trim()
                });

            if (error) throw error;
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background-dark animate-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="sticky top-0 z-50 glass-dark border-b border-white/5 p-4 flex items-center gap-4">
                <button onClick={onBack} className="text-white/40 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex items-center gap-3">
                    <img src={otherParticipant.avatar_url} className="size-10 rounded-xl object-cover" alt="Participant" />
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">{otherParticipant.name}</h3>
                        <div className="flex items-center gap-1.5">
                            <div className="size-1.5 bg-green-500 rounded-full"></div>
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Online</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-full opacity-20">
                        <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender_id !== otherParticipant.user_id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-xl ${isMe ? 'bg-primary text-black rounded-tr-none' : 'glass-dark text-white/80 rounded-tl-none'}`}>
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                    <span className={`text-[9px] mt-1 block font-black uppercase tracking-wider ${isMe ? 'opacity-40' : 'text-white/20'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background-dark/80 backdrop-blur-md pb-8">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                    <button type="button" className="shrink-0 text-white/20 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">add_circle</span>
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Sua mensagem..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-white/20"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isSending}
                            className="absolute right-2 top-1.5 size-11 rounded-xl bg-primary text-black flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-[20px] font-black">send</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
