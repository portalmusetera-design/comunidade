
import React from 'react';
import { View } from '../types';

interface BottomNavProps {
  active: View;
  onNavigate: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ active, onNavigate }) => {
  const items = [
    { id: 'FEED' as View, icon: 'grid_view', label: 'Feed' },
    { id: 'COMMUNITIES' as View, icon: 'explore', label: 'Explorar' },
    { id: 'ALERTS' as View, icon: 'emergency_share', label: 'Alertas', badge: true },
    { id: 'PROFILE' as View, icon: 'account_circle', label: 'Perfil' }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 md:hidden">
      <nav className="glass-dark rounded-[2.5rem] py-3 px-8 flex justify-between items-center shadow-2xl border border-[#c5a059]/20">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-50 hover:opacity-100'}`}
            >
              <div className="relative">
                <span className={`material-symbols-outlined text-[28px] ${isActive ? 'filled text-primary' : 'text-white'}`}>
                  {item.icon}
                </span>
                {item.badge && (
                   <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-brand-dark"></span>
                )}
              </div>
              {isActive && (
                <span className="text-[9px] font-black uppercase tracking-widest text-primary animate-in fade-in slide-in-from-bottom-1">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
