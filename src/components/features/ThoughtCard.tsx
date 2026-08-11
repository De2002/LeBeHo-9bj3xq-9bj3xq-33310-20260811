import { Thought } from '@/types';
import { AvatarBubble } from './AvatarBubble';
import { GeoTag } from './GeoTag';
import { formatRelativeTime, getCategoryColor, cn } from '@/lib/utils';
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

interface ThoughtCardProps {
  thought: Thought;
  onClick: () => void;
  onToggleSave: (id: string) => void;
}

export function ThoughtCard({ thought, onClick, onToggleSave }: ThoughtCardProps) {
  return (
    <div
      className="group bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl p-5 cursor-pointer hover:border-[hsl(var(--accent-primary))]/30 hover:bg-[hsl(var(--surface-hover))] transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <AvatarBubble username={thought.author.username} displayName={thought.author.displayName} size="sm" />
          <div>
            <div className="text-xs font-semibold text-[hsl(var(--text-primary))]">
              {thought.author.displayName || `@${thought.author.username}`}
            </div>
            <div className="text-xs text-[hsl(var(--text-muted))]">@{thought.author.username}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GeoTag geo={thought.geo} />
          <button
            className={cn(
              'p-1 rounded transition-colors',
              thought.isSaved ? 'text-[hsl(var(--accent-primary))]' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--accent-primary))]'
            )}
            onClick={(e) => { e.stopPropagation(); onToggleSave(thought.id); }}
          >
            <Star className="w-4 h-4" fill={thought.isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <h3 className="font-serif text-base font-semibold text-[hsl(var(--text-primary))] leading-snug mb-2">
        {thought.title}
      </h3>
      <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed line-clamp-2">
        {thought.preview}
      </p>

      <div className="flex items-center justify-between mt-4">
        <span className={cn('text-xs px-2 py-0.5 rounded-full', getCategoryColor(thought.category))}>
          {thought.category}
        </span>
        <div className="flex items-center gap-3 text-xs text-[hsl(var(--text-muted))]">
          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{thought.agreeCount}</span>
          <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3" />{thought.disagreeCount}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{thought.discussionCount}</span>
          <span>{formatRelativeTime(thought.publishedAt)}</span>
        </div>
      </div>
    </div>
  );
}
