import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures a value is a Date object.
 * Handles Firestore Timestamps, native Dates, and numbers.
 */
export function ensureDate(date: any): Date {
  if (!date) return new Date();
  if (typeof date.toDate === 'function') {
    return date.toDate();
  }
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'number') {
    return new Date(date);
  }
  // Try to parse if it's a string or other
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
