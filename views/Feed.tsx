
import React, { useState, useEffect, useRef } from 'react';
import { CURRENT_USER, STORIES as INITIAL_STORIES } from '../constants';
import { View, Post, Story } from '../types';
import { getMusicTherapyInsight } from '../services/gemini';
import Header from '../components/Header';
import { supabase } from '../supabaseClient';

interface FeedProps {
  onNavigate: (view: View) => void;
  userProfile: any;
}

const Feed: React.FC<FeedProps> = ({ onNavigate, userProfile }) => {
  const [insight, setInsight] = useState("Sintonizando frequências terapêuticas...");
  const [isRefreshingInsight, setIsRefreshingInsight] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showImageInput, setShowImageInput] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);
  const storyTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshInsight();
    fetchPosts();
    fetchStories();

    // Subscribe to new posts
    const postSub = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    // Subscribe to new stories
    const storySub = supabase
      .channel('public:stories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
        fetchStories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postSub);
      supabase.removeChannel(storySub);
    };
  }, []);

  const fetchStories = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          author:profiles!user_id(name, avatar_url)
        `)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedStories: Story[] = (data || []).map(s => ({
        id: s.id,
        user: s.author?.name || 'Membro',
        avatar: s.author?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
        image: s.image_url,
        viewed: false // We could track this in local storage or DB
      }));

      setStories(formattedStories);
    } catch (err) {
      console.error('Error fetching stories:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      // Fetch posts with author info
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!user_id(name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch active user likes
      let likedIds = new Set<string>();
      if (authUser) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', authUser.id);

        if (likesData) {
          likedIds = new Set(likesData.map(l => l.post_id));
        }
      }

      // Fetch total like counts
      const { data: likeCounts } = await supabase
        .from('post_likes')
        .select('post_id');

      const likesMap: Record<string, number> = {};
      likeCounts?.forEach(l => {
        likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1;
      });

      // Fetch total comment counts
      const { data: commentCounts } = await supabase
        .from('post_comments')
        .select('post_id');

      const commentsMap: Record<string, number> = {};
      commentCounts?.forEach(c => {
        commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
      });

      const formattedPosts: Post[] = postsData.map(p => ({
        id: p.id,
        author: p.author?.name || 'Membro',
        authorAvatar: p.author?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
        time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: p.content,
        image: p.image_url,
        likes: likesMap[p.id] || 0,
        comments: commentsMap[p.id] || 0,
        tags: [p.community || 'Insight'],
      }));

      setPosts(formattedPosts);
      setLikedPosts(likedIds);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshInsight = async () => {
    setIsRefreshingInsight(true);
    const newInsight = await getMusicTherapyInsight();
    setInsight(newInsight);
    setIsRefreshingInsight(false);
  };

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingStory(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `story-${authUser.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from('stories')
        .insert({
          user_id: authUser.id,
          image_url: publicUrl
        });

      if (error) throw error;

      fetchStories();
    } catch (err) {
      console.error('Error uploading story:', err);
      alert('Erro ao postar história.');
    } finally {
      setIsUploadingStory(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageUrl(URL.createObjectURL(file));
      setShowImageInput(true);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedFile) return;
    setIsPosting(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      let finalImageUrl = "";
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${authUser.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: authUser.id,
          content: content,
          image_url: finalImageUrl || null,
          community: 'Insight'
        });

      if (error) throw error;

      setContent("");
      setImageUrl("");
      setSelectedFile(null);
      setShowImageInput(false);
      setIsPosting(false);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
      fetchPosts(); // Refresh manually for immediate feedback
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Erro ao publicar post.');
      setIsPosting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const isLiked = likedPosts.has(postId);
    const newLikedPosts = new Set(likedPosts);

    try {
      if (isLiked) {
        newLikedPosts.delete(postId);
        await supabase
          .from('post_likes')
          .delete()
          .match({ post_id: postId, user_id: authUser.id });

        setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes - 1 } : p));
      } else {
        newLikedPosts.add(postId);
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: authUser.id });

        const { data: postAuthor } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', postId)
          .single();

        if (postAuthor && postAuthor.user_id !== authUser.id) {
          await supabase.from('notifications').insert({
            user_id: postAuthor.user_id,
            actor_id: authUser.id,
            type: 'LIKE',
            message: 'curtiu seu post',
            related_id: postId
          });
        }
        setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
      }
      setLikedPosts(newLikedPosts);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const toggleComments = async (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      // Fetch comments if not already fetched or to refresh
      fetchComments(postId);
    }
    setExpandedComments(newExpanded);
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:profiles!user_id(name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPostComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const addComment = async (postId: string) => {
    const content = newComment[postId];
    if (!content?.trim()) return;

    setIsSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: authUser.id,
          content: content.trim()
        });

      if (error) throw error;

      const { data: postAuthor } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (postAuthor && postAuthor.user_id !== authUser.id) {
        await supabase.from('notifications').insert({
          user_id: postAuthor.user_id,
          actor_id: authUser.id,
          type: 'COMMENT',
          message: 'comentou no seu post',
          related_id: postId
        });
      }

      setNewComment(prev => ({ ...prev, [postId]: "" }));
      fetchComments(postId);
      // Update comment count locally
      setPosts(posts.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleShare = async (post: Post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post de ${post.author} na Comunidade MuseTera`,
          text: post.content,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    } else {
      navigator.clipboard.writeText(`${post.content} - Veja mais na Comunidade MuseTera`);
      alert('Conteúdo copiado para a área de transferência!');
    }
  };

  const openStory = (story: Story) => {
    setSelectedStory(story);
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, viewed: true } : s));
  };

  const closeStory = () => {
    setSelectedStory(null);
    setStoryProgress(0);
  };

  return (
    <div className="flex flex-col pb-32 md:pb-12 bg-background-dark min-h-screen" ref={topRef}>
      {/* Premium Header - Mobile Only */}
      <Header
        title="Comunidade MuseTera"
        showLogo
        rightAction={
          <button onClick={() => onNavigate('CHAT')} className="size-10 rounded-full glass flex items-center justify-center text-white/70 relative">
            <span className="material-symbols-outlined">chat_bubble</span>
            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full animate-pulse"></span>
          </button>
        }
      />

      <div className="w-full max-w-3xl mx-auto">
        {/* Stories Tray */}
        <div className="flex gap-5 overflow-x-auto no-scrollbar p-6 items-center">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <input
              type="file"
              ref={storyFileInputRef}
              onChange={handleStoryUpload}
              className="hidden"
              accept="image/*"
            />
            <div
              onClick={() => !isUploadingStory && storyFileInputRef.current?.click()}
              className="relative size-16 md:size-20 rounded-full p-0.5 bg-gradient-to-tr from-primary/50 to-white/10 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <img src={userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80'} className={`size-full rounded-full object-cover grayscale-[40%] ${isUploadingStory ? 'animate-pulse opacity-50' : ''}`} alt="Me" />
              <div className="absolute bottom-0 right-0 size-6 bg-primary rounded-full border-4 border-background-dark flex items-center justify-center">
                {isUploadingStory ? (
                  <div className="size-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined text-black font-black text-[14px]">add</span>
                )}
              </div>
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{isUploadingStory ? 'Enviando...' : 'Postar'}</span>
          </div>

          {stories.map((story) => (
            <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group">
              <div className={`size-16 md:size-20 rounded-full p-[3px] transition-all group-active:scale-95 ${story.viewed ? 'bg-white/5' : 'bg-gradient-to-tr from-primary via-white/50 to-brand-blue'}`}>
                <div className="size-full rounded-full p-0.5 bg-background-dark">
                  <img src={story.avatar} className="size-full rounded-full object-cover" alt={story.user} />
                </div>
              </div>
              <span className={`text-[10px] font-bold tracking-widest truncate w-16 text-center ${story.viewed ? 'text-white/30' : 'text-primary'}`}>
                {story.user.split(' ')[0]}
              </span>
            </div>
          ))}
          {stories.length === 0 && (
            <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3 border border-white/5">
              <span className="material-symbols-outlined text-white/20 text-sm">auto_awesome_motion</span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Acompanhe momentos</span>
            </div>
          )}
        </div>

        {/* AI Daily Card */}
        <div className="px-6 mb-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-brand-blue/50 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative glass-dark rounded-3xl p-6 overflow-hidden border border-white/5 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined filled">neurology</span>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Reflexão Comunidade MuseTera AI</h4>
                    <p className="text-xs text-white/40 font-medium italic">Frequência do dia</p>
                  </div>
                </div>
                <button onClick={refreshInsight} disabled={isRefreshingInsight} className="size-9 rounded-full glass flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <span className={`material-symbols-outlined text-[18px] ${isRefreshingInsight ? 'animate-spin' : ''}`}>sync</span>
                </button>
              </div>
              <p className="text-base font-display font-medium leading-relaxed text-white italic">
                {isRefreshingInsight ? "Sintonizando nova melodia..." : `"${insight}"`}
              </p>
            </div>
          </div>
        </div>

        {/* Post Creator */}
        <div className="px-6 mb-10">
          <div className="glass-dark rounded-3xl p-5 border border-white/5 shadow-xl">
            <div className="flex gap-4">
              <img src={userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80'} className="size-12 rounded-2xl object-cover ring-1 ring-white/10" alt="Me" />
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 resize-none h-14 placeholder:text-white/20 font-medium"
                  placeholder="Qual o tom da sua prática hoje?"
                ></textarea>

                {imageUrl && (
                  <div className="mt-3 relative rounded-2xl overflow-hidden border border-white/10 group bg-black/40">
                    <img src={imageUrl} className="w-full h-auto max-h-64 object-cover" alt="Preview" />
                    <button
                      onClick={() => { setImageUrl(""); setSelectedFile(null); }}
                      className="absolute top-2 right-2 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`size-10 rounded-xl flex items-center justify-center transition-all ${imageUrl ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'glass text-white/40 hover:text-primary'}`}
                    >
                      <span className="material-symbols-outlined text-[22px]">image</span>
                    </button>
                  </div>
                  <button
                    onClick={handlePost}
                    disabled={isPosting || (!content.trim() && !selectedFile)}
                    className="bg-primary hover:bg-white text-black h-11 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-primary/20 disabled:opacity-30 active:scale-95"
                  >
                    {isPosting ? 'Enviando...' : 'Publicar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Feed */}
        <div className="px-6 space-y-8 pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Diário Clínico</h2>
            <div className="h-px flex-1 mx-4 bg-white/5"></div>
            <span className="material-symbols-outlined text-white/20 text-sm">filter_list</span>
          </div>

          {loading ? (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
              <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Carregando Insights...</p>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <article key={post.id} className="glass-dark rounded-[2.5rem] overflow-hidden border border-white/5 shadow-sm animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <img src={post.authorAvatar} className="size-12 rounded-2xl object-cover ring-1 ring-white/10" alt={post.author} />
                      <div>
                        <h3 className="font-bold text-sm text-white">{post.author}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-primary font-black uppercase tracking-wider">{post.community || 'Insight'}</span>
                          <span className="text-[10px] text-white/30 font-bold">• {post.time}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-white/20 hover:text-white transition-colors">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                  </div>

                  <p className="text-sm leading-relaxed text-white/70 mb-6 whitespace-pre-wrap font-medium">
                    {post.content}
                  </p>

                  {post.image && (
                    <div className="rounded-3xl overflow-hidden mb-6 border border-white/5 shadow-2xl bg-black/40">
                      <img src={post.image} className="w-full h-auto object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-700" alt="Post content" loading="lazy" />
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-7">
                      <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-2.5 transition-all ${likedPosts.has(post.id) ? 'text-red-500 scale-110' : 'text-white/30 hover:text-primary'}`}>
                        <span className={`material-symbols-outlined text-[24px] ${likedPosts.has(post.id) ? 'filled' : ''}`}>favorite</span>
                        <span className="text-xs font-black">{post.likes}</span>
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center gap-2.5 transition-all ${expandedComments.has(post.id) ? 'text-primary' : 'text-white/30 hover:text-primary'}`}
                      >
                        <span className="material-symbols-outlined text-[24px]">comment</span>
                        <span className="text-xs font-black">{post.comments}</span>
                      </button>
                      <button onClick={() => handleShare(post)} className="flex items-center gap-2.5 text-white/30 hover:text-primary transition-all">
                        <span className="material-symbols-outlined text-[24px]">share</span>
                      </button>
                    </div>
                    <button className="text-white/20 hover:text-primary transition-all">
                      <span className="material-symbols-outlined">bookmark</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments.has(post.id) && (
                    <div className="mt-8 pt-8 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                      <div className="space-y-6 mb-8">
                        {postComments[post.id]?.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <img src={comment.author?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80'} className="size-8 rounded-xl object-cover" alt={comment.author?.name} />
                            <div className="flex-1 bg-white/5 rounded-2xl p-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{comment.author?.name}</span>
                                <span className="text-[10px] text-white/20">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-xs text-white/70 leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        {(!postComments[post.id] || postComments[post.id].length === 0) && (
                          <p className="text-center text-[10px] text-white/20 uppercase tracking-widest py-4">Nenhum comentário ainda</p>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <img src={userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80'} className="size-10 rounded-xl object-cover" alt="Me" />
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={newComment[post.id] || ""}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && addComment(post.id)}
                            placeholder="Adicione um comentário..."
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder:text-white/20 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          />
                          <button
                            onClick={() => addComment(post.id)}
                            disabled={isSubmittingComment[post.id] || !newComment[post.id]?.trim()}
                            className="absolute right-2 top-1.5 size-7 rounded-lg bg-primary text-black flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">send</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 animate-in fade-in duration-700">
              <div className="size-24 rounded-full glass flex items-center justify-center text-white/5 border border-white/5">
                <span className="material-symbols-outlined text-5xl">forum</span>
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-display font-black text-white uppercase tracking-tight mb-2">O feed está silencioso</h3>
                <p className="text-xs text-white/30 font-medium leading-relaxed uppercase tracking-widest">Seja o primeiro a compartilhar um insight clínico!</p>
              </div>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="mt-4 px-8 py-3 bg-white/5 hover:bg-white/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5"
              >
                Publicar Agora
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer Overlay */}
      {selectedStory && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="absolute top-0 left-0 right-0 p-6 flex gap-2 z-[1010]">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-[40ms]" style={{ width: `${storyProgress}%` }}></div>
            </div>
          </div>
          <div className="absolute top-10 left-6 right-6 flex justify-between items-center z-[1010]">
            <div className="flex items-center gap-3">
              <img src={selectedStory.avatar} className="size-11 rounded-full border-2 border-primary object-cover" alt={selectedStory.user} />
              <span className="text-white font-bold text-sm tracking-tight">{selectedStory.user}</span>
            </div>
            <button onClick={closeStory} className="text-white bg-white/10 size-11 rounded-full flex items-center justify-center backdrop-blur-xl">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="w-full h-full flex items-center justify-center relative bg-brand-dark">
            <img src={selectedStory.image} className="w-full h-auto max-h-screen object-contain animate-in zoom-in-105 duration-[5000ms] ease-out" alt="Story" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
