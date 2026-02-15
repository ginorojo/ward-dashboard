import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const userSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  role: z.enum(['administrator', 'bishop', 'counselor', 'secretary']),
});

export const createUserSchema = userSchema.extend({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
});


export const interviewSchema = z.object({
  personInterviewed: z.string().min(2, { message: 'Name is required' }),
  interviewer: z.string().min(2, { message: 'Interviewer is required' }),
  purpose: z.string().min(3, { message: 'Purpose is required' }),
  scheduledDate: z.date(),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Use HH:mm" }),
  status: z.enum(['pending', 'completed']),
});

export const reunionSchema = z.object({
  reason: z.string().min(3, { message: 'Reason must be at least 3 characters' }),
  participants: z.string().min(2, { message: 'Participants are required' }),
  scheduledAt: z.date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Use HH:mm" }),
  status: z.enum(['pending', 'completed']),
});

export const bishopricNoteSchema = z.object({
  date: z.date(),
  content: z.string().min(10, { message: 'Note content must be at least 10 characters' }),
  meetingId: z.string()
});

export const sacramentMeetingSchema = z.object({
    date: z.date(),
    preside: z.string().optional(),
    dirige: z.string().optional(),
    pianist: z.string().optional(),
    musicDirector: z.string().optional(),
    authorities: z.string().optional(),
    openingHymn: z.object({
        name: z.string().optional(),
        number: z.coerce.number().optional(),
    }).optional(),
    openingPrayer: z.string().optional(),
    hymnSacramental: z.object({
        name: z.string().optional(),
        number: z.coerce.number().optional(),
    }).optional(),
    speakers: z.array(z.string().optional()).max(3).optional(),
    hymnFinal: z.object({
        name: z.string().optional(),
        number: z.coerce.number().optional(),
    }).optional(),
    closingPrayer: z.string().optional(),
    asuntosDelBarrio: z.array(z.object({
        id: z.string().optional(),
        type: z.enum(['relevo', 'sostenimiento']).optional(),
        personName: z.string().optional(),
        calling: z.string().optional(),
    })).optional(),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

    