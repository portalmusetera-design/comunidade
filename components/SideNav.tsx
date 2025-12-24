
import React from 'react';
import { View } from '../types';
import { supabase } from '../supabaseClient';

interface SideNavProps {
  active: View;
  onNavigate: (view: View) => void;
  userProfile?: any;
}

const SideNav: React.FC<SideNavProps> = ({ active, onNavigate, userProfile }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Use userProfile data or defaults
  const displayName = userProfile?.name || 'Ana Silva';
  const displayRole = userProfile?.role || 'MT-BC Especialista';
  const displayAvatar = userProfile?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9zv2k5iDfnfMYhm0IUmzFJfdADo1MoQEIYJNKBGan4vL8PGdDO2SE_oiq6JWX2xIOlTG1xxEG7ZZsgaZGUKG5Li8Lln7uPR34V2Li5LskkFcmFlTHikjPGf4BPhI2u3Vc6uoKIoH6ww1lL06JuNzArBZLFF5Zibom-dw8So81kT4aBhx8ey4TUWZr8LGmY2WylQJSe6mfeHfFGlBjiJmKffFCu629QsNbdW8UXU24VpDPDp8I';
  const items = [
    { id: 'FEED' as View, icon: 'grid_view', label: 'Feed' },
    { id: 'COMMUNITIES' as View, icon: 'explore', label: 'Comunidades' },
    { id: 'CHAT' as View, icon: 'chat_bubble', label: 'Mensagens', badge: true },
    { id: 'ALERTS' as View, icon: 'emergency_share', label: 'Notificações' },
    { id: 'PROFILE' as View, icon: 'account_circle', label: 'Meu Perfil' }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 glass-dark border-r border-white/5 p-6 z-[100]">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="size-12 rounded-full overflow-hidden bg-[#0a1220]">
          <img src="logo.png" className="size-full object-cover scale-[1.5]" alt="Logo" onError={(e) => (e.currentTarget.src = 'https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/musetera-logo-mock.png')} />
        </div>
        <div>
          <h1 className="text-lg font-black text-primary italic uppercase leading-tight">Comunidade</h1>
          <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">MuseTera</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${isActive
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(197,160,89,0.05)]'
                : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
            >
              <div className="relative">
                <span className={`material-symbols-outlined text-[24px] ${isActive ? 'filled' : ''}`}>
                  {item.icon}
                </span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 size-2 bg-primary rounded-full ring-2 ring-brand-dark"></span>
                )}
              </div>
              <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 glass rounded-2xl border border-white/5">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-3">Sessão Ativa</p>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-brand-blue p-0.5">
            <img src={displayAvatar} className="size-full rounded-[10px] object-cover" alt="Profile" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-black text-white truncate">{displayName}</h4>
            <span className="text-[8px] font-bold text-primary/60 truncate block">{displayRole}</span>
          </div>
          <button
            onClick={handleLogout}
            className="material-symbols-outlined text-white/20 text-sm hover:text-red-500 transition-colors"
          >
            logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SideNav;
