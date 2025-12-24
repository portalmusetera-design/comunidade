
import React, { useState, useEffect } from 'react';
import { View } from './types';
import Feed from './views/Feed';
import Profile from './views/Profile';
import Communities from './views/Communities';
import Alerts from './views/Alerts';
import ChatList from './views/ChatList';
import Auth from './views/Auth';
import BottomNav from './components/BottomNav';
import SideNav from './components/SideNav';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('FEED');
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUserProfile(data);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'FEED': return <Feed onNavigate={setCurrentView} userProfile={userProfile} />;
      case 'COMMUNITIES': return <Communities onNavigate={setCurrentView} />;
      case 'ALERTS': return <Alerts onNavigate={setCurrentView} />;
      case 'PROFILE': return <Profile onNavigate={setCurrentView} onProfileUpdate={() => session && fetchProfile(session.user.id)} />;
      case 'CHAT': return <ChatList onNavigate={setCurrentView} />;
      default: return <Feed onNavigate={setCurrentView} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={() => setCurrentView('FEED')} />;
  }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-white font-body">
      {/* Sidebar - Apenas Desktop */}
      <SideNav active={currentView} onNavigate={setCurrentView} userProfile={userProfile} />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col md:ml-64 relative">
        <main className="flex-1 w-full max-w-5xl mx-auto px-0 md:px-6">
          {renderView()}
        </main>

        {/* Navegação Inferior - Apenas Mobile */}
        <BottomNav active={currentView} onNavigate={setCurrentView} />
      </div>
    </div>
  );
};

export default App;
