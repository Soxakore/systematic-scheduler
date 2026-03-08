import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useCalendars, useMyShares, useSharedWithMe, useCreateShare, useDeleteShare, useRespondToShare,
  useIncomingSuggestions, useOutgoingSuggestions, useCreateSuggestion, useRespondToSuggestion,
  useCreateEvent, useSharedCalendarEvents,
} from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash, Check, X, PaperPlaneTilt, Users, CalendarPlus, Eye } from '@phosphor-icons/react';
import { format } from 'date-fns';
import type { EventSuggestion, CalendarShare } from '@/types';

export default function SharingPage() {
  const { user } = useAuth();
  const { data: calendars } = useCalendars();
  const { data: myShares } = useMyShares();
  const { data: sharedWithMe } = useSharedWithMe();
  const { data: incoming } = useIncomingSuggestions();
  const { data: outgoing } = useOutgoingSuggestions();
  const createShare = useCreateShare();
  const deleteShare = useDeleteShare();
  const respondToShare = useRespondToShare();
  const createSuggestion = useCreateSuggestion();
  const respondToSuggestion = useRespondToSuggestion();
  const createEvent = useCreateEvent();

  // Share dialog
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareCalendarId, setShareCalendarId] = useState('');
  const [sharePermission, setSharePermission] = useState('view');

  // Suggest dialog
  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const [suggestToShare, setSuggestToShare] = useState<CalendarShare | null>(null);
  const [sugTitle, setSugTitle] = useState('');
  const [sugDescription, setSugDescription] = useState('');
  const [sugLocation, setSugLocation] = useState('');
  const [sugStartDate, setSugStartDate] = useState('');
  const [sugStartTime, setSugStartTime] = useState('09:00');
  const [sugEndDate, setSugEndDate] = useState('');
  const [sugEndTime, setSugEndTime] = useState('10:00');
  const [sugIsAllDay, setSugIsAllDay] = useState(false);
  const [sugMessage, setSugMessage] = useState('');

  // View shared calendar dialog
  const [viewingShare, setViewingShare] = useState<CalendarShare | null>(null);

  const acceptedSharedWithMe = sharedWithMe?.filter(s => s.status === 'accepted') || [];
  const sharedCalendarIds = acceptedSharedWithMe.map(s => s.calendar_id);
  const { data: sharedEvents } = useSharedCalendarEvents(sharedCalendarIds);

  const handleShareCalendar = async () => {
    if (!shareEmail.trim() || !shareCalendarId) { toast.error('Fill in all fields'); return; }
    if (shareEmail.trim() === user?.email) { toast.error("Can't share with yourself"); return; }
    try {
      await createShare.mutateAsync({ calendar_id: shareCalendarId, shared_with_email: shareEmail.trim(), permission: sharePermission });
      toast.success('Calendar shared! They\'ll see it when they log in.');
      setShowShareDialog(false);
      setShareEmail('');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRespondShare = async (id: string, status: 'accepted' | 'declined') => {
    try {
      await respondToShare.mutateAsync({ id, status });
      toast.success(status === 'accepted' ? 'Calendar accepted!' : 'Invitation declined');
    } catch (err: any) { toast.error(err.message); }
  };

  const openSuggestDialog = (share: CalendarShare) => {
    setSuggestToShare(share);
    setSugTitle('');
    setSugDescription('');
    setSugLocation('');
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    setSugStartDate(tomorrow.toISOString().split('T')[0]);
    setSugEndDate(tomorrow.toISOString().split('T')[0]);
    setSugStartTime('09:00');
    setSugEndTime('10:00');
    setSugIsAllDay(false);
    setSugMessage('');
    setShowSuggestDialog(true);
  };

  const handleSendSuggestion = async () => {
    if (!sugTitle.trim() || !suggestToShare) { toast.error('Title is required'); return; }
    const start = sugIsAllDay ? new Date(sugStartDate + 'T00:00:00') : new Date(sugStartDate + 'T' + sugStartTime);
    const end = sugIsAllDay ? new Date(sugEndDate + 'T23:59:59') : new Date(sugEndDate + 'T' + sugEndTime);
    if (end < start) { toast.error('End must be after start'); return; }
    try {
      await createSuggestion.mutateAsync({
        to_user_id: suggestToShare.owner_id,
        title: sugTitle.trim(),
        description: sugDescription,
        location: sugLocation,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        is_all_day: sugIsAllDay,
        message: sugMessage,
        calendar_id: suggestToShare.calendar_id,
      });
      toast.success('Suggestion sent!');
      setShowSuggestDialog(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAcceptSuggestion = async (sug: EventSuggestion) => {
    try {
      const calendarId = sug.calendar_id || calendars?.[0]?.id;
      if (!calendarId) { toast.error('No calendar available'); return; }
      await createEvent.mutateAsync({
        title: sug.title,
        description: sug.description || '',
        location: sug.location || '',
        start_time: sug.start_time,
        end_time: sug.end_time,
        is_all_day: sug.is_all_day,
        calendar_id: calendarId,
        system_id: null,
        is_system_generated: false,
        is_customized: false,
        system_instance_date: null,
        reminder_minutes: null,
      });
      await respondToSuggestion.mutateAsync({ id: sug.id, status: 'accepted' });
      toast.success('Event added to your calendar!');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeclineSuggestion = async (id: string) => {
    try {
      await respondToSuggestion.mutateAsync({ id, status: 'declined' });
      toast.success('Suggestion declined');
    } catch (err: any) { toast.error(err.message); }
  };

  const pendingIncoming = incoming?.filter(s => s.status === 'pending') || [];
  const pendingShares = sharedWithMe?.filter(s => s.status === 'pending') || [];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-primary" weight="duotone" />
          </div>
          Sharing & Coordination
        </h1>
      </div>

      {/* Pending notifications */}
      {(pendingShares.length > 0 || pendingIncoming.length > 0) && (
        <div className="mb-6 space-y-2">
          {pendingShares.map(share => (
            <Card key={share.id} className="p-3 border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">📬 Calendar shared with you</p>
                  <p className="text-xs text-muted-foreground truncate">From {share.shared_with_email !== user?.email ? share.shared_with_email : 'a partner'} · {share.permission} access</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => handleRespondShare(share.id, 'accepted')}>
                    <Check className="h-3 w-3" /> Accept
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleRespondShare(share.id, 'declined')}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {pendingIncoming.map(sug => (
            <Card key={sug.id} className="p-3 border-accent/30 bg-accent/5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">🎯 Event suggestion: {sug.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(sug.start_time), 'MMM d, h:mm a')} – {format(new Date(sug.end_time), 'h:mm a')}
                    {sug.message && ` · "${sug.message}"`}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => handleAcceptSuggestion(sug)}>
                    <CalendarPlus className="h-3 w-3" /> Accept
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleDeclineSuggestion(sug.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="shared" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="shared" className="flex-1">My Shares</TabsTrigger>
          <TabsTrigger value="partner" className="flex-1">Partner Calendars</TabsTrigger>
          <TabsTrigger value="suggestions" className="flex-1">Suggestions</TabsTrigger>
        </TabsList>

        {/* MY SHARES TAB */}
        <TabsContent value="shared" className="space-y-3 mt-4">
          <Button onClick={() => { setShareCalendarId(calendars?.[0]?.id || ''); setShowShareDialog(true); }} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Share a Calendar
          </Button>
          {myShares?.length === 0 && <p className="text-sm text-muted-foreground">You haven't shared any calendars yet.</p>}
          {myShares?.map(share => {
            const cal = calendars?.find(c => c.id === share.calendar_id);
            return (
              <Card key={share.id} className="p-3 flex items-center gap-3">
                <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: cal?.color || '#6B7280' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{cal?.name || 'Calendar'}</p>
                  <p className="text-xs text-muted-foreground truncate">Shared with {share.shared_with_email}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {share.status}
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteShare.mutateAsync(share.id).then(() => toast.success('Share removed'))}>
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </Card>
            );
          })}
        </TabsContent>

        {/* PARTNER CALENDARS TAB */}
        <TabsContent value="partner" className="space-y-3 mt-4">
          {acceptedSharedWithMe.length === 0 && <p className="text-sm text-muted-foreground">No shared calendars yet. Ask a partner to share theirs!</p>}
          {acceptedSharedWithMe.map(share => {
            const eventsForCal = sharedEvents?.filter(e => e.calendar_id === share.calendar_id) || [];
            return (
              <Card key={share.id} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Eye className="h-4 w-4 text-primary shrink-0" weight="duotone" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">From {share.shared_with_email !== user?.email ? share.shared_with_email : 'partner'}</p>
                      <p className="text-xs text-muted-foreground">{eventsForCal.length} upcoming events</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {share.permission === 'suggest' && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openSuggestDialog(share)}>
                        <PaperPlaneTilt className="h-3 w-3" /> Suggest
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setViewingShare(viewingShare?.id === share.id ? null : share)}>
                      {viewingShare?.id === share.id ? 'Hide' : 'View'}
                    </Button>
                  </div>
                </div>
                {viewingShare?.id === share.id && (
                  <div className="mt-2 space-y-1 border-t pt-2">
                    {eventsForCal.length === 0 && <p className="text-xs text-muted-foreground">No events</p>}
                    {eventsForCal.slice(0, 10).map(event => (
                      <div key={event.id} className="flex items-center gap-2 text-xs py-1">
                        <span className="text-muted-foreground shrink-0">{format(new Date(event.start_time), 'MMM d, h:mm a')}</span>
                        <span className="text-foreground truncate">{event.title}</span>
                        {event.location && <span className="text-muted-foreground truncate">📍 {event.location}</span>}
                      </div>
                    ))}
                    {eventsForCal.length > 10 && <p className="text-xs text-muted-foreground">+{eventsForCal.length - 10} more</p>}
                  </div>
                )}
              </Card>
            );
          })}
        </TabsContent>

        {/* SUGGESTIONS TAB */}
        <TabsContent value="suggestions" className="space-y-3 mt-4">
          {outgoing && outgoing.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sent by you</h3>
              {outgoing.map(sug => (
                <Card key={sug.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{sug.title}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(sug.start_time), 'MMM d, h:mm a')}</p>
                    </div>
                    <Badge variant={sug.status === 'accepted' ? 'default' : sug.status === 'declined' ? 'destructive' : 'secondary'} className="text-[10px] shrink-0">
                      {sug.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {incoming && incoming.filter(s => s.status !== 'pending').length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Received</h3>
              {incoming.filter(s => s.status !== 'pending').map(sug => (
                <Card key={sug.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{sug.title}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(sug.start_time), 'MMM d, h:mm a')}</p>
                    </div>
                    <Badge variant={sug.status === 'accepted' ? 'default' : 'destructive'} className="text-[10px] shrink-0">
                      {sug.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {(!outgoing || outgoing.length === 0) && (!incoming || incoming.filter(s => s.status !== 'pending').length === 0) && (
            <p className="text-sm text-muted-foreground">No suggestions yet. Share a calendar with suggest permission to enable this.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Share a Calendar</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Calendar</Label>
              <Select value={shareCalendarId} onValueChange={setShareCalendarId}>
                <SelectTrigger><SelectValue placeholder="Select calendar" /></SelectTrigger>
                <SelectContent>
                  {calendars?.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Partner's Email</Label>
              <Input value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="partner@email.com" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label>Permission</Label>
              <Select value={sharePermission} onValueChange={setSharePermission}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View only</SelectItem>
                  <SelectItem value="suggest">View + Suggest events</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleShareCalendar} disabled={createShare.isPending}>
              Share Calendar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suggest Event Dialog */}
      <Dialog open={showSuggestDialog} onOpenChange={setShowSuggestDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Suggest an Event</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={sugTitle} onChange={e => setSugTitle(e.target.value)} placeholder="e.g. Dinner together" autoFocus />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={sugIsAllDay} onCheckedChange={setSugIsAllDay} id="sug-allday" />
              <Label htmlFor="sug-allday">All day</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input type="date" value={sugStartDate} onChange={e => setSugStartDate(e.target.value)} />
              </div>
              {!sugIsAllDay && (
                <div className="space-y-1.5">
                  <Label>Start time</Label>
                  <Input type="time" value={sugStartTime} onChange={e => setSugStartTime(e.target.value)} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input type="date" value={sugEndDate} onChange={e => setSugEndDate(e.target.value)} />
              </div>
              {!sugIsAllDay && (
                <div className="space-y-1.5">
                  <Label>End time</Label>
                  <Input type="time" value={sugEndTime} onChange={e => setSugEndTime(e.target.value)} />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={sugLocation} onChange={e => setSugLocation(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={sugDescription} onChange={e => setSugDescription(e.target.value)} placeholder="Optional" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Message to partner</Label>
              <Input value={sugMessage} onChange={e => setSugMessage(e.target.value)} placeholder="e.g. Let's catch up!" />
            </div>
            <Button className="w-full gap-1.5" onClick={handleSendSuggestion} disabled={createSuggestion.isPending}>
              <PaperPlaneTilt className="h-4 w-4" /> Send Suggestion
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
