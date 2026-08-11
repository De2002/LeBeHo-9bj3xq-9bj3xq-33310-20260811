import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AvatarBubbleProps {
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm:  'w-7 h-7 text-xs',
  md:  'w-9 h-9 text-sm',
  lg:  'w-12 h-12 text-base',
  xl:  'w-20 h-20 text-2xl',
};

const COLOR_MAP = [
  'from-amber-600 to-amber-400',
  'from-rose-600 to-rose-400',
  'from-emerald-600 to-emerald-400',
  'from-indigo-600 to-indigo-400',
  'from-violet-600 to-violet-400',
  'from-teal-600 to-teal-400',
  'from-orange-600 to-orange-400',
  'from-cyan-600 to-cyan-400',
];

function getColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_MAP[Math.abs(hash) % COLOR_MAP.length];
}

export function AvatarBubble({ username, displayName, avatarUrl, size = 'md', className }: AvatarBubbleProps) {
  const name = displayName || username;
  const initials = getInitials(name);
  const gradient = getColor(username);

  if (avatarUrl) {
    return (
      <div className={cn('rounded-full overflow-hidden flex-shrink-0 select-none', SIZE_MAP[size], className)}>
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={e => {
            // Fallback to initials if image fails
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white flex-shrink-0 select-none',
      gradient,
      SIZE_MAP[size],
      className
    )}>
      {initials}
    </div>
  );
}
