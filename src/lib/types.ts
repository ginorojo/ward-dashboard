
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'administrator' | 'bishop' | 'counselor' | 'secretary';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Timestamp;
  createdBy: string;
  isActive: boolean;
}

export interface Interview {
  id: string;
  scheduledDate: Timestamp;
  personInterviewed: string;
  interviewer: string;
  purpose: string;
  status: 'pending' | 'completed';
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Reunion {
  id: string;
  scheduledAt: Timestamp;
  reason: string;
  participants: string[];
  status: 'pending' | 'completed';
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MeetingNote {
  id: string;
  date: Timestamp;
  type: string;
  otherType?: string;
  content: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BishopricMeetingNote extends MeetingNote {} // Backwards compatibility for now

export interface AsuntoBarrio {
  id: string;
  type: 'relevo' | 'sostenimiento';
  personName: string;
  calling: string;
  createdAt: Timestamp;
}

export interface Hymn {
    name?: string;
    number?: number;
}

export interface SacramentMeeting {
  id:string;
  date: Timestamp;
  preside?: string;
  dirige?: string;
  pianist?: string;
  musicDirector?: string;
  authorities?: string;
  openingHymn?: Hymn;
  openingPrayer?: string;
  hymnSacramental?: Hymn;
  speakers?: string[];
  hymnFinal?: Hymn;
  closingPrayer?: string;
  asuntosDelBarrio?: AsuntoBarrio[];
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Log {
    id: string;
    userId: string;
    action: 'create' | 'update' | 'delete' | 'login';
    entity: string;
    entityId: string;
    timestamp: Timestamp;
    details: string;
}
