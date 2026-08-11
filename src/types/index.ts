export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  joinedDate: string;
  thoughtCount: number;
  followerCount: number;
  followingCount: number;
  agreementCount: number;
  disagreementCount: number;
  discussionCount: number;
}

export type GeoScope = 'Global' | 'Country' | 'City';

export interface GeoTag {
  scope: GeoScope;
  label: string; // e.g. "Uganda", "Kampala", "Global"
  flag?: string; // emoji flag
}

export interface Thought {
  id: string;
  authorId: string;
  author: {
    username: string;
    displayName: string;
    avatar: string;
  };
  title: string;       // "the truth / thought"
  preview: string;     // "the reason" — short excerpt
  body: string;        // full explanation
  category: Category;
  geo: GeoTag;
  publishedAt: string;
  isRead: boolean;
  isSaved: boolean;
  isDraft: boolean;
  agreeCount: number;
  disagreeCount: number;
  discussionCount: number;
  tags: string[];
  imageUrl?: string;
}

export type Category =
  | 'Life'
  | 'Relationships'
  | 'Family'
  | 'Friendship'
  | 'Work & Career'
  | 'Money'
  | 'Education'
  | 'Society'
  | 'Culture'
  | 'Politics'
  | 'Technology'
  | 'Health & Wellbeing'
  | 'Entertainment'
  | 'Travel & Places'
  | 'Beliefs & Values'
  | 'Personal'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Life', 'Relationships', 'Family', 'Friendship', 'Work & Career',
  'Money', 'Education', 'Society', 'Culture', 'Politics', 'Technology',
  'Health & Wellbeing', 'Entertainment', 'Travel & Places', 'Beliefs & Values',
  'Personal', 'Other'
];

export interface InboxFilter {
  scope: 'all' | 'unread' | 'saved';
  geo?: string;
  category?: Category;
  search?: string;
}

export interface Subscription {
  type: 'topic' | 'person' | 'place';
  id: string;
  label: string;
  icon?: string;
}
