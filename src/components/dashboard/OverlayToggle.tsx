import { Moon, Baby, Droplets, CircleDot } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { OverlayType } from '@/types/baby-log';
import { cn } from '@/lib/utils';

interface OverlayToggleProps {
  activeOverlays: OverlayType[];
  onToggle: (overlay: OverlayType) => void;
}

const overlayConfig: { type: OverlayType; icon: typeof Moon; label: string; colorClass: string }[] = [
  { type: 'naps', icon: Moon, label: 'Sleep', colorClass: 'data-[state=on]:bg-baby-sleep data-[state=on]:text-baby-sleep-foreground' },
  { type: 'feedings', icon: Baby, label: 'Feedings', colorClass: 'data-[state=on]:bg-baby-feeding data-[state=on]:text-baby-feeding-foreground' },
  { type: 'wetDiapers', icon: Droplets, label: 'Wet', colorClass: 'data-[state=on]:bg-baby-wet data-[state=on]:text-baby-wet-foreground' },
  { type: 'dirtyDiapers', icon: CircleDot, label: 'Dirty', colorClass: 'data-[state=on]:bg-baby-dirty data-[state=on]:text-baby-dirty-foreground' },
];

export function OverlayToggle({ activeOverlays, onToggle }: OverlayToggleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {overlayConfig.map(({ type, icon: Icon, label, colorClass }) => (
        <Toggle
          key={type}
          pressed={activeOverlays.includes(type)}
          onPressedChange={() => onToggle(type)}
          className={cn('rounded-full gap-2 px-4', colorClass)}
          aria-label={`Toggle ${label}`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Toggle>
      ))}
    </div>
  );
}
