import { useMemo } from 'react';
import { useSharedWithMe, useSharedCalendarEvents } from './useData';
import type { CalendarEvent } from '@/types';

export interface PartnerEvent extends CalendarEvent {
  isPartner: true;
  partnerCalendarId: string;
}

/**
 * Fetches partner (shared calendar) events for a date range.
 * Returns events marked with `isPartner: true` for distinct styling.
 */
export function usePartnerEvents(startDate?: Date, endDate?: Date) {
  const { data: shares } = useSharedWithMe();

  const acceptedCalendarIds = useMemo(
    () => (shares?.filter(s => s.status === 'accepted') || []).map(s => s.calendar_id),
    [shares]
  );

  const { data: rawPartnerEvents } = useSharedCalendarEvents(acceptedCalendarIds, startDate, endDate);

  const partnerEvents: PartnerEvent[] = useMemo(
    () =>
      (rawPartnerEvents || []).map(e => ({
        ...e,
        isPartner: true as const,
        partnerCalendarId: e.calendar_id,
      })),
    [rawPartnerEvents]
  );

  return partnerEvents;
}

/** Helper: convert hex color to rgba with opacity */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
