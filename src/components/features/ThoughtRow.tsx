import { Thought } from '@/types';
import { AvatarBubble } from './AvatarBubble';
import { formatInboxDate, cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ThoughtRowProps {
  thought: Thought;
  onClick: () => void;
  onToggleSave: (id: string) => void;
}

export function ThoughtRow({ thought, onClick, onToggleSave }: ThoughtRowProps) {
  const { user } = useAuth();
  const isUnread = !thought.isRead;
  const avatarUrl = thought.author.avatar || (user && thought.authorId === user.id ? user.avatarUrl : null);

  return (
    <div
      className={cn(
        'group flex items-start gap-4 px-5 py-4 border-b border-[hsl(var(--row-border))] cursor-pointer transition-colors duration-150',
        isUnread
          ? 'bg-[hsl(var(--row-unread-bg))] hover:bg-[hsl(var(--row-unread-hover))]'
          : 'bg-[hsl(var(--row-read-bg))] hover:bg-[hsl(var(--row-read-hover))]'
      )}
      onClick={onClick}
    >
      {/* Avatar — large, Gmail-scale */}
      <AvatarBubble
        username={thought.author.username}
        displayName={thought.author.displayName}
        avatarUrl={avatarUrl}
        size="lg"
        className="flex-shrink-0 mt-0.5"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">

        {/* Title — dominant subject */}
        <p className={cn(
          'text-[15px] leading-snug truncate mb-1',
          isUnread
            ? 'font-bold text-[hsl(var(--text-primary))]'
            : 'font-semibold text-[hsl(var(--text-secondary))]'
        )}>
          {thought.title}
        </p>

        {/* Preview text */}
        <p className="text-[13px] text-[hsl(var(--text-muted))] truncate leading-snug mb-1.5">
          {thought.preview}
        </p>

        {/* Quiet metadata row: @username on left · timestamp + unread dot on right */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-[hsl(var(--text-muted))]/60 truncate leading-snug">
            @{thought.author.username}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[11px] text-[hsl(var(--text-muted))]/60 leading-snug">
              {formatInboxDate(thought.publishedAt)}
            </span>
            <div className={cn(
              'w-2 h-2 rounded-full flex-shrink-0 transition-opacity',
              isUnread ? 'bg-[hsl(var(--accent-primary))] opacity-100' : 'opacity-0'
            )} />
          </div>
        </div>
      </div>

      {/* Star — always visible, fills on save */}
      <button
        className={cn(
          'flex-shrink-0 mt-0.5 p-1 rounded-md transition-colors',
          thought.isSaved
            ? 'text-[hsl(var(--accent-primary))]'
            : 'text-[hsl(var(--text-muted))]/35 group-hover:text-[hsl(var(--text-muted))] hover:!text-[hsl(var(--accent-primary))]'
        )}
        onClick={e => { e.stopPropagation(); onToggleSave(thought.id); }}
        aria-label={thought.isSaved ? 'Unsave' : 'Save'}
      >
        <Star className="w-[18px] h-[18px]" fill={thought.isSaved ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
