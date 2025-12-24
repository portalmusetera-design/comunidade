
import React from 'react';
import { View } from '../types';
import Header from '../components/Header';

interface ChatListProps {
  onNavigate: (view: View) => void;
}

const ChatList: React.FC<ChatListProps> = ({ onNavigate }) => {
  const chats = [
    { name: 'Ana Silva', msg: 'Oi! Você viu o estudo de NMT?', time: '10:30', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR_jCDk3m1AaNtLwmCTCO7tGRgsU76lu_fmDK_dJ_7KvQppMHPi085Q0wXP0F6oJ6PlhWOd-aW72iDX5vQWYh2bTB2UmiUombXp46Zcd87A8bh4dl-l6ADtDb8gq13LcS8NVT6dDS3QpElJ_3a-ktHYOu6aqlOkB3v6-i7X4d57s68UcF7mTUrwzMBSS6k-H7GnIMlMaCLu6Q5FZMCOGZhAYS38AXR5_nexIqPhWJ4wNfkVk2dZYs877gLYDKRYmPOmzY77-mXtrg', unread: 2 },
    { name: 'Grupo de Estudos Orff', msg: 'João: A reunião será amanhã...', time: 'Ontem', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9Gc57RIn3td_RwQLPMMZpLm4hKrwRrDK1omC5pX3Xhojc2VVBPIz2gG236Px2qPJWkHPHzxLADezqgdROAQ9_dAnAYPW6qdfCbP7TYWJ9bcRGvTpZjhBHB1fr7SnfnN3aBj60u-enPZdWNhvgba1gFvUrV9ZVMW0yEmNxlxVZdtdMY_pLNMUxk3jgTqFlx_ZYOHQxMuX0d7UA4qJ9ArsYbHW9Q7kt-NZDoP13tvcdZRN9fsFqU-gBlMfivAB2Q9aX_MFt3JFonqU', unread: 0 }
  ];

  return (
    <div className="flex flex-col pb-24">
      <Header
        title="Conversas"
        rightAction={
          <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
            <span className="material-symbols-outlined">edit_square</span>
          </button>
        }
      />

      <div className="flex flex-col">
        {chats.map((chat, i) => (
          <button
            key={i}
            className="flex items-center gap-4 px-4 py-4 hover:bg-white dark:hover:bg-surface-dark border-b border-gray-100 dark:border-gray-800 transition-colors text-left"
          >
            <div className="relative shrink-0">
              <img src={chat.avatar} className="size-14 rounded-xl object-cover shadow-sm" alt="Avatar" />
              {i === 0 && <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 rounded-full border-[3px] border-background-light dark:border-background-dark"></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h4 className="font-bold text-base truncate">{chat.name}</h4>
                <span className={`text-[10px] ${chat.unread > 0 ? 'text-primary font-bold' : 'text-gray-400'}`}>{chat.time}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{chat.msg}</p>
                {chat.unread > 0 && <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{chat.unread}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
