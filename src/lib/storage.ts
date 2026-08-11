import { User, Thought, Subscription } from '@/types';
import { MOCK_ME, MOCK_THOUGHTS, DRAFT_THOUGHTS, MY_THOUGHTS } from '@/constants/mockData';

const KEYS = {
  USER: 'lebelho_user',
  ONBOARDED: 'lebelho_onboarded',
  THOUGHTS: 'lebelho_thoughts',
  DRAFTS: 'lebelho_drafts',
  MY_THOUGHTS: 'lebelho_my_thoughts',
  SUBSCRIPTIONS: 'lebelho_subscriptions',
  FOLLOWING: 'lebelho_following',
  INBOX_BG: 'lebelho_inbox_bg',
  INBOX_BG_OPACITY: 'lebelho_inbox_bg_opacity',
};

export function isOnboarded(): boolean {
  return localStorage.getItem(KEYS.ONBOARDED) === 'true';
}

export function completeOnboarding(user: User, subscriptions: Subscription[]): void {
  localStorage.setItem(KEYS.ONBOARDED, 'true');
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
  localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
}

export function getCurrentUser(): User {
  const stored = localStorage.getItem(KEYS.USER);
  if (stored) return JSON.parse(stored);
  return MOCK_ME;
}

export function getThoughts(): Thought[] {
  const stored = localStorage.getItem(KEYS.THOUGHTS);
  if (stored) return JSON.parse(stored);
  return MOCK_THOUGHTS;
}

export function saveThoughts(thoughts: Thought[]): void {
  localStorage.setItem(KEYS.THOUGHTS, JSON.stringify(thoughts));
}

export function markAsRead(id: string): void {
  const thoughts = getThoughts();
  const updated = thoughts.map(t => t.id === id ? { ...t, isRead: true } : t);
  saveThoughts(updated);
}

export function toggleSaved(id: string): boolean {
  const thoughts = getThoughts();
  let newState = false;
  const updated = thoughts.map(t => {
    if (t.id === id) {
      newState = !t.isSaved;
      return { ...t, isSaved: newState };
    }
    return t;
  });
  saveThoughts(updated);
  return newState;
}

export function getSavedThoughts(): Thought[] {
  return getThoughts().filter(t => t.isSaved);
}

export function getDrafts(): Thought[] {
  const stored = localStorage.getItem(KEYS.DRAFTS);
  if (stored) return JSON.parse(stored);
  return DRAFT_THOUGHTS;
}

export function saveDraft(draft: Thought): void {
  const drafts = getDrafts();
  const existing = drafts.findIndex(d => d.id === draft.id);
  if (existing >= 0) {
    drafts[existing] = draft;
  } else {
    drafts.push(draft);
  }
  localStorage.setItem(KEYS.DRAFTS, JSON.stringify(drafts));
}

export function deleteDraft(id: string): void {
  const drafts = getDrafts().filter(d => d.id !== id);
  localStorage.setItem(KEYS.DRAFTS, JSON.stringify(drafts));
}

export function getMyThoughts(): Thought[] {
  const stored = localStorage.getItem(KEYS.MY_THOUGHTS);
  if (stored) return JSON.parse(stored);
  return MY_THOUGHTS;
}

export function publishThought(thought: Thought): void {
  const mine = getMyThoughts();
  mine.unshift(thought);
  localStorage.setItem(KEYS.MY_THOUGHTS, JSON.stringify(mine));
  const thoughts = getThoughts();
  thoughts.unshift(thought);
  saveThoughts(thoughts);
}

export function getSubscriptions(): Subscription[] {
  const stored = localStorage.getItem(KEYS.SUBSCRIPTIONS);
  if (stored) return JSON.parse(stored);
  return [];
}

export function getFollowing(): string[] {
  const stored = localStorage.getItem(KEYS.FOLLOWING);
  if (stored) return JSON.parse(stored);
  return ['user-002', 'user-004', 'user-006'];
}

export function toggleFollow(userId: string): boolean {
  const following = getFollowing();
  const idx = following.indexOf(userId);
  let isFollowing: boolean;
  if (idx >= 0) {
    following.splice(idx, 1);
    isFollowing = false;
  } else {
    following.push(userId);
    isFollowing = true;
  }
  localStorage.setItem(KEYS.FOLLOWING, JSON.stringify(following));
  return isFollowing;
}

export function updateUser(updates: Partial<User>): void {
  const current = getCurrentUser();
  const updated = { ...current, ...updates };
  localStorage.setItem(KEYS.USER, JSON.stringify(updated));
}

// ─── Inbox Background ────────────────────────────────────────────────────
export function getInboxBg(): { imageUrl: string | null; opacity: number } {
  const imageUrl = localStorage.getItem(KEYS.INBOX_BG);
  const opacity = parseFloat(localStorage.getItem(KEYS.INBOX_BG_OPACITY) ?? '0.15');
  return { imageUrl, opacity };
}

export function setInboxBg(imageUrl: string | null, opacity: number): void {
  if (imageUrl) {
    localStorage.setItem(KEYS.INBOX_BG, imageUrl);
  } else {
    localStorage.removeItem(KEYS.INBOX_BG);
  }
  localStorage.setItem(KEYS.INBOX_BG_OPACITY, String(opacity));
}

export function clearAll(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}
