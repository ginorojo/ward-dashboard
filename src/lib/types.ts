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

export interface BishopricMeetingNote {
  id: string;
  date: Timestamp;
  content: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  meetingId: string;
}

export interface BishopricMeeting {
    id: string;
    date: Timestamp;
    createdBy: string;
    createdAt: Timestamp;
}

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

    