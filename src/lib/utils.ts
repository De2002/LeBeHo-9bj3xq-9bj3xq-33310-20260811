import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInboxDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function getCategoryColor(category: string): string {
  // Uses explicit bg + text classes that are visible in both light and dark modes
  const map: Record<string, string> = {
    'Life':              'bg-amber-100  text-amber-800  dark:bg-amber-900/40  dark:text-amber-300',
    'Relationships':     'bg-rose-100   text-rose-800   dark:bg-rose-900/40   dark:text-rose-300',
    'Family':            'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    'Friendship':        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    'Work & Career':     'bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300',
    'Money':             'bg-green-100  text-green-800  dark:bg-green-900/40  dark:text-green-300',
    'Education':         'bg-cyan-100   text-cyan-800   dark:bg-cyan-900/40   dark:text-cyan-300',
    'Society':           'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    'Culture':           'bg-pink-100   text-pink-800   dark:bg-pink-900/40   dark:text-pink-300',
    'Politics':          'bg-red-100    text-red-800    dark:bg-red-900/40    dark:text-red-300',
    'Technology':        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Health & Wellbeing':'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Entertainment':     'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
    'Travel & Places':   'bg-teal-100   text-teal-800   dark:bg-teal-900/40   dark:text-teal-300',
    'Beliefs & Values':  'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    'Personal':          'bg-stone-100  text-stone-700  dark:bg-stone-700/40  dark:text-stone-300',
    'Other':             'bg-neutral-100 text-neutral-700 dark:bg-neutral-700/40 dark:text-neutral-300',
  };
  return map[category] ?? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700/40 dark:text-neutral-300';
}
