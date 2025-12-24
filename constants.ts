
import { User, Post, Community, Notification, Story } from './types';

export const CURRENT_USER: User = {
  id: 'me',
  name: 'Usuário',
  role: 'Membro da Comunidade',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
  location: '',
  stats: {
    connections: 0,
    communities: 0,
    articles: 0
  },
  badges: {
    trust: 0,
    cool: 0
  },
  bio: 'Bem-vindo à Comunidade MuseTera!'
};

export const STORIES: Story[] = [];

export const POSTS: Post[] = [];

export const COMMUNITIES: Community[] = [];

export const NOTIFICATIONS: Notification[] = [];
