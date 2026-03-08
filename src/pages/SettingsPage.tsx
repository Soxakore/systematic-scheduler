import { useState, useEffect } from 'react';
import { useProfile, useUpdateProfile } from '@/hooks/useData';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon } from '@phosphor-icons/react';
import { toast } from 'sonner';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
  'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland',
];

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [defaultView, setDefaultView] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setTimezone(profile.timezone);
      setWeekStart(profile.week_start_day.toString());
      setDefaultView(profile.default_view);
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        name,
        timezone,
        week_start_day: parseInt(weekStart),
        default_view: defaultView as any,
      });
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading…</div>;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-6">Settings</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Week starts on</Label>
            <Select value={weekStart} onValueChange={setWeekStart}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Default view</Label>
            <Select value={defaultView} onValueChange={setDefaultView}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={updateProfile.isPending}>Save</Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? <Moon className="h-4 w-4 text-muted-foreground" weight="bold" /> : <Sun className="h-4 w-4 text-amber-500" weight="bold" />}
              <div>
                <p className="text-sm font-medium text-foreground">{theme === 'dark' ? 'Night Mode' : 'Day Mode'}</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
              </div>
            </div>
            <Switch checked={theme === 'light'} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" onClick={async () => { await signOut(); navigate('/login'); }}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
