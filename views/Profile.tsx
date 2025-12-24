
import React, { useState, useEffect } from 'react';
import { CURRENT_USER as INITIAL_USER, POSTS } from '../constants';
import { View, User } from '../types';
import Header from '../components/Header';
import { supabase } from '../supabaseClient';

interface ProfileProps {
  onNavigate: (view: View) => void;
  onProfileUpdate?: () => void;
}

type ProfileTab = 'POSTS' | 'MEDIA' | 'ARTICLES';

const Profile: React.FC<ProfileProps> = ({ onNavigate, onProfileUpdate }) => {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [activeTab, setActiveTab] = useState<ProfileTab>('POSTS');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Edit form state
  const [editName, setEditName] = useState(user.name);
  const [editRole, setEditRole] = useState(user.role);
  const [editBio, setEditBio] = useState(user.bio);
  const [editLocation, setEditLocation] = useState(user.location || '');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data) {
        const updatedUser = {
          ...INITIAL_USER,
          name: data.name || INITIAL_USER.name,
          role: data.role || INITIAL_USER.role,
          bio: data.bio || INITIAL_USER.bio,
          location: data.location || INITIAL_USER.location,
          avatar: data.avatar_url || INITIAL_USER.avatar
        };
        setUser(updatedUser);
        setEditName(updatedUser.name);
        setEditRole(updatedUser.role);
        setEditBio(updatedUser.bio);
        setEditLocation(updatedUser.location);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${authUser.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      setUser(prev => ({ ...prev, avatar: publicUrl }));
      if (onProfileUpdate) onProfileUpdate();
    } catch (err) {
      alert('Erro ao carregar imagem. Verifique se o bucket "avatars" é público.');
      console.error('Error uploading avatar:', err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          name: editName,
          role: editRole,
          bio: editBio,
          location: editLocation,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setUser({
        ...user,
        name: editName,
        role: editRole,
        bio: editBio,
        location: editLocation
      });
      setIsEditModalOpen(false);
      if (onProfileUpdate) onProfileUpdate();
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Erro ao salvar perfil.');
    }
  };

  const userPosts = POSTS.filter(p => p.author === 'Ana Silva');

  return (
    <div className="flex flex-col pb-24 min-h-full">
      {/* App Bar */}
      <Header
        title="Meu Perfil"
        showBack
        onBack={() => onNavigate('FEED')}
        rightAction={
          <div className="flex items-center gap-2">
            <button className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors group">
              <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">settings</span>
            </button>
            <button
              onClick={() => import('../supabaseClient').then(m => m.supabase.auth.signOut())}
              className="flex size-10 items-center justify-center rounded-full hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        }
      />

      {/* Profile Header */}
      <div className="relative">
        {/* Cover Photo Placeholder */}
        <div className="h-32 bg-gradient-to-r from-primary to-blue-400 w-full"></div>

        <div className="flex flex-col items-center px-6 -mt-16 text-center">
          <div className="relative mb-4 group">
            <img
              src={user.avatar}
              className="size-32 rounded-3xl object-cover border-4 border-background-light dark:border-background-dark shadow-2xl transition-transform duration-500 group-hover:scale-105"
              alt="Profile"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 size-10 bg-primary text-black rounded-full shadow-lg border-4 border-background-light dark:border-background-dark flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
              title="Alterar foto de perfil"
            >
              <span className="material-symbols-outlined text-xl">photo_camera</span>
            </button>
          </div>

          <div className="flex items-center gap-2 justify-center">
            <h1 className="text-2xl font-black tracking-tight">{user.name}</h1>
            <span className="material-symbols-outlined text-primary filled text-[20px]">verified</span>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-semibold leading-tight">
            {user.role}
          </p>

          <div className="flex items-center gap-1 justify-center mt-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">location_on</span>
            {user.location}
          </div>

          {/* Orkut-inspired Badges */}
          <div className="flex gap-3 mt-5">
            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-2xl flex items-center gap-2 border border-blue-100 dark:border-blue-800/50">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px]">verified_user</span>
              <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest">{user.badges.trust}% Confiável</span>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 px-4 py-1.5 rounded-2xl flex items-center gap-2 border border-pink-100 dark:border-pink-800/50">
              <span className="material-symbols-outlined text-pink-600 dark:text-pink-400 text-[18px]">favorite</span>
              <span className="text-[10px] font-black text-pink-700 dark:text-pink-300 uppercase tracking-widest">{user.badges.cool}% Legal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex gap-4 px-4 py-8 overflow-x-auto no-scrollbar">
        {[
          { label: 'Conexões', val: user.stats.connections, icon: 'person_add' },
          { label: 'Grupos', val: user.stats.communities, icon: 'groups' },
          { label: 'Artigos', val: user.stats.articles, icon: 'article' }
        ].map((s) => (
          <div key={s.label} className="flex-1 min-w-[100px] bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-center shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer">
            <span className="material-symbols-outlined text-primary/40 text-sm mb-1">{s.icon}</span>
            <p className="text-2xl font-black">{s.val}</p>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.15em]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* About Section */}
      <div className="px-4 mb-6">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest text-gray-400">
              <span className="material-symbols-outlined text-primary text-xl">info</span>
              Biografia
            </h3>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs font-bold text-primary"
            >
              Editar
            </button>
          </div>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-medium">
            {user.bio}
          </p>
        </div>
      </div>

      {/* Tabbed Content Area */}
      <div className="px-4">
        <div className="flex border-b border-gray-100 dark:border-gray-800 mb-4">
          {[
            { id: 'POSTS', label: 'Postagens', icon: 'grid_view' },
            { id: 'MEDIA', label: 'Mídia', icon: 'image' },
            { id: 'ARTICLES', label: 'Artigos', icon: 'description' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 border-b-2 transition-all ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? 'filled' : ''}`}>{tab.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Rendering */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'POSTS' && (
            <div className="flex flex-col gap-4">
              {userPosts.map(post => (
                <div key={post.id} className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{post.time}</span>
                    <span className="material-symbols-outlined text-gray-300 text-sm">more_horiz</span>
                  </div>
                  <p className="text-sm line-clamp-3 mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">{post.content}</p>
                  <div className="flex gap-4 items-center pt-3 border-t border-gray-50 dark:border-gray-800">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                      <span className="material-symbols-outlined text-[16px]">favorite</span> {post.likes}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                      <span className="material-symbols-outlined text-[16px]">chat_bubble</span> {post.comments}
                    </div>
                  </div>
                </div>
              ))}
              {userPosts.length === 0 && (
                <div className="py-10 text-center opacity-40">
                  <span className="material-symbols-outlined text-4xl mb-2">post_add</span>
                  <p className="text-xs font-bold uppercase tracking-widest">Nenhuma postagem recente</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'MEDIA' && (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden group relative">
                  <img
                    src={`https://picsum.photos/seed/${i + 100}/300/300`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                    alt="Gallery item"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="material-symbols-outlined text-white text-sm">zoom_in</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ARTICLES' && (
            <div className="flex flex-col gap-3">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-4 p-3 bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary transition-all cursor-pointer group">
                  <div className="size-16 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">auto_stories</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors truncate">Musicoterapia e Neuroplasticidade em idosos</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Publicado em 14 Mar, 2024</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">Uma análise profunda sobre o estímulo rítmico...</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">Editar Perfil</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Nome Completo</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Cargo / Especialidade</label>
                <input
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Localização</label>
                <input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Sobre (Bio)</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary h-24 resize-none transition-all leading-relaxed"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-4 text-sm font-black bg-primary text-white rounded-2xl shadow-xl shadow-primary/30 active:scale-95 transition-all"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
