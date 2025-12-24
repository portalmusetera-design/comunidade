
export type View = 'FEED' | 'COMMUNITIES' | 'ALERTS' | 'PROFILE' | 'CHAT' | 'EVENT_DETAIL' | 'SEARCH' | 'TOPIC_DETAIL';

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  location?: string;
  stats: {
    connections: number;
    communities: number;
    articles: number;
  };
  badges: {
    trust: number;
    cool: number;
  };
  bio: string;
}

export interface Post {
  id: string;
  author: string;
  authorAvatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  tags?: string[];
  community?: string;
}

export interface Community {
  id: string;
  name: string;
  members: string;
  description: string;
  image: string;
  updates?: number;
}

export interface Notification {
  id: string;
  user: string;
  avatar: string;
  type: 'LIKE' | 'COMMENT' | 'FRIEND_REQUEST' | 'MENTION';
  message: string;
  time: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}

export interface Story {
  id: string;
  user: string;
  avatar: string;
  image: string;
  viewed: boolean;
}
