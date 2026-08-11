import { GeoTag as GeoTagType } from '@/types';
import { Globe, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeoTagProps {
  geo: GeoTagType;
  className?: string;
}

export function GeoTag({ geo, className }: GeoTagProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
      geo.scope === 'Global'
        ? 'bg-[hsl(var(--geo-global-bg))] text-[hsl(var(--geo-global-fg))]'
        : geo.scope === 'Country'
        ? 'bg-[hsl(var(--geo-country-bg))] text-[hsl(var(--geo-country-fg))]'
        : 'bg-[hsl(var(--geo-city-bg))] text-[hsl(var(--geo-city-fg))]',
      className
    )}>
      {geo.flag ? (
        <span className="text-xs">{geo.flag}</span>
      ) : (
        <Globe className="w-3 h-3" />
      )}
      <span>{geo.label}</span>
    </span>
  );
}
