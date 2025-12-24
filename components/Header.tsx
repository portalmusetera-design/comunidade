
import React from 'react';
import { View } from '../types';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  mobileOnly?: boolean;
  variant?: 'glass' | 'solid';
  showLogo?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  rightAction,
  mobileOnly = true,
  variant = 'glass',
  showLogo = false
}) => {
  const baseClasses = "sticky top-0 z-[60] border-b px-6 py-4 flex justify-between items-center backdrop-blur-md";

  const variantClasses = variant === 'glass'
    ? "glass-dark border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
    : "bg-background-light/95 dark:bg-background-dark/95 border-gray-200 dark:border-gray-800";

  const responsiveClass = mobileOnly ? "md:hidden" : "";

  return (
    <header className={`${baseClasses} ${variantClasses} ${responsiveClass}`}>
      <div className="flex items-center gap-4">
        {showBack && onBack && (
          <button
            onClick={onBack}
            className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        {showLogo ? (
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full overflow-hidden bg-[#0a1220]">
              <img
                src="logo.png"
                className="size-full object-cover scale-[1.5]"
                alt="Comunidade MuseTera Logo"
                onError={(e) => (e.currentTarget.src = 'https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/musetera-logo-mock.png')}
              />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-primary italic uppercase leading-tight">Comunidade</h1>
              <span className="text-[9px] font-bold text-white/50 tracking-widest uppercase">MuseTera</span>
            </div>
          </div>
        ) : (
          <h2 className="text-xl font-black tracking-tighter text-white uppercase italic">{title}</h2>
        )}
      </div>

      {rightAction && (
        <div className="flex items-center gap-2">
          {rightAction}
        </div>
      )}
    </header>
  );
};

export default Header;
