import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings as SettingsType } from '@/types/baby-log';

interface SettingsPanelProps {
  settings: SettingsType;
  onUpdateSettings: (updates: Partial<SettingsType>) => void;
}

const hours = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i.toString().padStart(2, '0')}:00`,
}));

export function SettingsPanel({ settings, onUpdateSettings }: SettingsPanelProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Configure your baby log dashboard preferences
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="birthDate">Baby's Birth Date</Label>
            <Input
              id="birthDate"
              type="date"
              value={settings.birthDate || ''}
              onChange={(e) => onUpdateSettings({ birthDate: e.target.value || null })}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Used to calculate baby's age in weeks
            </p>
          </div>

          <div className="space-y-2">
            <Label>Night Time Range</Label>
            <div className="flex items-center gap-2">
              <Select
                value={settings.nightStartHour.toString()}
                onValueChange={(v) => onUpdateSettings({ nightStartHour: parseInt(v) })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">to</span>
              <Select
                value={settings.nightEndHour.toString()}
                onValueChange={(v) => onUpdateSettings({ nightEndHour: parseInt(v) })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Define when night sleep starts and ends
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint">Data Endpoint (Optional)</Label>
            <Input
              id="endpoint"
              type="url"
              placeholder="https://api.example.com/baby-log"
              value={settings.dataEndpoint}
              onChange={(e) => onUpdateSettings({ dataEndpoint: e.target.value })}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              For future API integration
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
