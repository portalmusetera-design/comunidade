
import React, { useState, useMemo } from 'react';
import { COMMUNITIES as INITIAL_COMMUNITIES, POSTS as INITIAL_POSTS, CURRENT_USER } from '../constants';
import { View, Community, Post } from '../types';
import Header from '../components/Header';

interface CommunitiesProps {
  onNavigate: (view: View) => void;
}

const CATEGORIES = ['Todos', 'Neurologia', 'Autismo', 'Hospitalar', 'Educação'];

const Communities: React.FC<CommunitiesProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [communities, setCommunities] = useState<Community[]>(INITIAL_COMMUNITIES);
  const [allPosts, setAllPosts] = useState<Post[]>(INITIAL_POSTS);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set(['c1']));
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  // New community form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // New post form state
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const filteredCommunities = useMemo(() => {
    return communities.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || c.description.toLowerCase().includes(activeCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, communities, activeCategory]);

  const communityPosts = useMemo(() => {
    if (!selectedCommunity) return [];
    return allPosts.filter(p => p.community === selectedCommunity.name);
  }, [selectedCommunity, allPosts]);

  const toggleJoin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newJoined = new Set(joinedIds);
    if (newJoined.has(id)) {
      newJoined.delete(id);
    } else {
      newJoined.add(id);
    }
    setJoinedIds(newJoined);
  };

  const handleCreateCommunity = () => {
    if (!newName.trim()) return;
    const newComm: Community = {
      id: `c-${Date.now()}`,
      name: newName,
      description: newDesc || 'Sem descrição definida.',
      members: '1',
      image: `https://picsum.photos/seed/${Date.now()}/400/200`,
      updates: 0
    };
    setCommunities([newComm, ...communities]);
    setJoinedIds(prev => new Set(prev).add(newComm.id));
    setNewName('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  const handleCreatePost = () => {
    if (!postContent.trim() || !selectedCommunity) return;
    setIsPosting(true);

    setTimeout(() => {
      const newPost: Post = {
        id: `p-${Date.now()}`,
        author: CURRENT_USER.name,
        authorAvatar: CURRENT_USER.avatar,
        time: 'Agora',
        content: postContent,
        image: postImage.trim() || undefined,
        likes: 0,
        comments: 0,
        community: selectedCommunity.name,
        tags: ['Comunidade']
      };

      setAllPosts([newPost, ...allPosts]);
      setPostContent('');
      setPostImage('');
      setIsPosting(false);
      setShowPostModal(false);
    }, 800);
  };

  // View: Community Detail
  if (selectedCommunity) {
    return (
      <div className="flex flex-col min-h-screen bg-background-dark pb-32 md:pb-12 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Community Header/Banner */}
        <div className="relative h-48 md:h-64 w-full">
          <img src={selectedCommunity.image} className="w-full h-full object-cover" alt="Banner" />
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/40 to-transparent"></div>
          <button
            onClick={() => setSelectedCommunity(null)}
            className="absolute top-6 left-6 size-10 rounded-full glass flex items-center justify-center text-white"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>

        <div className="px-6 -mt-10 relative z-10 max-w-4xl mx-auto w-full">
          <div className="flex justify-between items-end mb-4">
            <div className="size-24 rounded-2xl bg-brand-dark p-1 ring-4 ring-background-dark overflow-hidden shadow-2xl">
              <img src={selectedCommunity.image} className="size-full object-cover rounded-xl" alt="Logo" />
            </div>
            <button
              onClick={(e) => toggleJoin(selectedCommunity.id, e)}
              className={`h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${joinedIds.has(selectedCommunity.id) ? 'glass text-white/40' : 'bg-primary text-black shadow-lg shadow-primary/20'}`}
            >
              {joinedIds.has(selectedCommunity.id) ? 'Membro' : 'Participar'}
            </button>
          </div>

          <h2 className="text-2xl md:text-4xl font-display font-black text-white mb-1">{selectedCommunity.name}</h2>
          <div className="flex items-center gap-4 text-xs font-bold text-primary mb-6">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm filled">groups</span>{selectedCommunity.members} membros</span>
            <span className="flex items-center gap-1 text-white/30"><span className="material-symbols-outlined text-sm">public</span> Grupo Público</span>
          </div>

          <p className="text-sm md:text-base text-white/60 leading-relaxed mb-8 max-w-2xl">
            {selectedCommunity.description}
          </p>

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Feed do Grupo</h3>
            <button
              onClick={() => setShowPostModal(true)}
              className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span> Novo Post
            </button>
          </div>

          {/* Group Specific Posts */}
          <div className="space-y-6 max-w-2xl">
            {communityPosts.length > 0 ? communityPosts.map(post => (
              <div key={post.id} className="glass-dark rounded-3xl p-5 border border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <img src={post.authorAvatar} className="size-8 rounded-full object-cover" alt="Author" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{post.author}</h4>
                    <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{post.time}</span>
                  </div>
                </div>
                <p className="text-sm text-white/70 mb-4 whitespace-pre-wrap">{post.content}</p>
                {post.image && (
                  <img src={post.image} className="w-full h-auto object-cover rounded-2xl mb-4 border border-white/5" alt="Post content" />
                )}
                <div className="flex gap-4">
                  <span className="flex items-center gap-1 text-[10px] font-black text-white/30"><span className="material-symbols-outlined text-[16px]">favorite</span> {post.likes}</span>
                  <span className="flex items-center gap-1 text-[10px] font-black text-white/30"><span className="material-symbols-outlined text-[16px]">comment</span> {post.comments}</span>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center opacity-20">
                <span className="material-symbols-outlined text-5xl mb-2">forum</span>
                <p className="text-xs font-bold uppercase tracking-widest">Nenhum post ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Novo Post */}
        {showPostModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-dark w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Novo no Grupo</h3>
                <button onClick={() => setShowPostModal(false)} className="text-white/20 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Seu Insight / Pergunta</label>
                  <textarea
                    autoFocus
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary h-32 resize-none outline-none transition-all"
                    placeholder="O que você quer compartilhar com a comunidade?"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Link de Imagem (Opcional)</label>
                  <input
                    value={postImage}
                    onChange={(e) => setPostImage(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => setShowPostModal(false)}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest glass text-white/40 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!postContent.trim() || isPosting}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest bg-primary text-black rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-30 transition-all active:scale-95"
                >
                  {isPosting ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View: Main List
  return (
    <div className="flex flex-col pb-32 md:pb-12 bg-background-dark min-h-screen">
      <Header title="Hub de Comunidades" />

      <div className="p-6 space-y-8">
        <div className="hidden md:block">
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-1">Explorar</h2>
          <p className="text-primary font-bold tracking-widest uppercase text-xs">Conecte-se com sua especialidade clínica</p>
        </div>

        {/* Search Bar Premium */}
        <div className="relative group max-w-2xl">
          <div className="absolute -inset-0.5 bg-primary/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/20 group-focus-within:text-primary transition-colors">search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-none glass-dark text-sm text-white focus:ring-1 focus:ring-primary/40 placeholder:text-white/20"
              placeholder="Buscar por especialidade ou tema..."
            />
          </div>
        </div>

        {/* Categories / Tabs Active */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map((tag) => {
            const isActive = activeCategory === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveCategory(tag)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap border transition-all uppercase tracking-widest ${isActive ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20 scale-105' : 'glass text-white/40 border-white/5 hover:text-white'}`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Comunidades em Destaque</h3>
          <span className="text-[10px] font-bold text-primary">{filteredCommunities.length} resultados</span>
        </div>

        {/* Communities List - Grid Responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.length > 0 ? (
            filteredCommunities.map((c) => (
              <article
                key={c.id}
                className="glass-dark rounded-3xl overflow-hidden border border-white/5 shadow-sm hover:border-primary/40 transition-all hover:translate-y-[-4px] cursor-pointer group"
                onClick={() => setSelectedCommunity(c)}
              >
                <div className="h-32 w-full overflow-hidden relative">
                  <img src={c.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={c.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark to-transparent"></div>
                  {c.updates && c.updates > 0 && (
                    <span className="absolute top-4 right-4 h-6 px-2 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-lg border-2 border-brand-dark shadow-xl">
                      {c.updates} NOVOS
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-base text-white truncate">{c.name}</h4>
                  </div>
                  <p className="text-xs text-white/50 line-clamp-2 leading-relaxed h-8 mb-6">
                    {c.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-md">{c.members} Membros</span>
                    <button
                      onClick={(e) => toggleJoin(c.id, e)}
                      className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all px-4 py-2 rounded-lg ${joinedIds.has(c.id) ? 'bg-white/5 text-white/20' : 'bg-primary/10 text-primary hover:bg-primary hover:text-black'}`}
                    >
                      {joinedIds.has(c.id) ? 'Membro' : 'Participar'}
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 animate-in fade-in duration-500">
              <div className="size-20 rounded-full glass flex items-center justify-center text-white/10">
                <span className="material-symbols-outlined text-4xl">search_off</span>
              </div>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Nada encontrado</p>
            </div>
          )}

          {/* Create Button Card */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="relative group min-h-[220px]"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-brand-blue rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative h-full glass-dark rounded-3xl p-8 border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-3 group-hover:border-primary/40 transition-all">
              <span className="material-symbols-outlined text-primary text-4xl group-hover:scale-110 transition-transform">add_circle</span>
              <div className="text-center">
                <span className="font-display font-black text-sm text-white uppercase tracking-widest block mb-1">Fundar Comunidade</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Modern Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-dark w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Nova Comunidade</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-white/20 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Nome da Comunidade</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="Ex: Reabilitação com Tambores"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Manifesto / Descrição</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary h-32 resize-none outline-none transition-all"
                  placeholder="Qual o propósito deste espaço?"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest glass text-white/40 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCommunity}
                disabled={!newName.trim()}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest bg-primary text-black rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-30 transition-all active:scale-95"
              >
                Fundar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communities;
