import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
  query,
  where,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { db } from './config';
import type { UserProfile, Log, Interview, BishopricMeetingNote, SacramentMeeting, AsuntoBarrio } from '../types';

// Generic log function
export const logAction = async (
  userId: string,
  action: Log['action'],
  entity: string,
  entityId: string,
  details: string = ''
) => {
  try {
    await addDoc(collection(db, 'logs'), {
      userId,
      action,
      entity,
      entityId,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log action:", error);
  }
};

// User Management
export const getUsers = async (): Promise<UserProfile[]> => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteUserAndProfile = async (uid: string) => {
  // Note: Deleting from Firebase Auth requires a backend environment (Cloud Function).
  // This function will only delete the Firestore user profile.
  // The user should be deactivated instead of deleted from the UI for full safety.
  await deleteDoc(doc(db, 'users', uid));
};


// Generic Firestore Functions
export const getCollection = async <T>(collectionName: string, order?: {field: string, direction?: "asc" | "desc"}): Promise<T[]> => {
    const collRef = collection(db, collectionName);
    const q = order ? query(collRef, orderBy(order.field, order.direction || 'desc')) : collRef;
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

export const getDocument = async <T>(collectionName: string, id: string): Promise<T | null> => {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
};


export const addDocument = async <T>(collectionName: string, data: T, userId: string, entityName: string): Promise<string> => {
    const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedBy: userId,
        updatedAt: serverTimestamp(),
    });
    await logAction(userId, 'create', entityName, docRef.id, JSON.stringify(data));
    return docRef.id;
};

export const updateDocument = async <T>(collectionName: string, id: string, data: Partial<T>, userId: string, entityName: string) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
        ...data,
        updatedBy: userId,
        updatedAt: serverTimestamp(),
    });
    await logAction(userId, 'update', entityName, id, JSON.stringify(data));
};

export const deleteDocument = async (collectionName: string, id: string, userId: string, entityName: string) => {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    await logAction(userId, 'delete', entityName, id);
};

// Specific for Bishopric Meeting Notes (subcollection)
export const getNotesForMeeting = async (meetingId: string): Promise<BishopricMeetingNote[]> => {
  const notesRef = collection(db, `bishopricMeetings/${meetingId}/notes`);
  const q = query(notesRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), meetingId } as BishopricMeetingNote));
};

export const addNoteToMeeting = async (meetingId: string, data: Omit<BishopricMeetingNote, 'id' | 'createdAt' | 'updatedAt' | 'meetingId'>, userId: string) => {
  const noteRef = await addDoc(collection(db, `bishopricMeetings/${meetingId}/notes`), {
    ...data,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
  await logAction(userId, 'create', 'bishopricNote', noteRef.id, `MeetingID: ${meetingId}`);
  return noteRef.id;
};

export const updateNoteInMeeting = async (meetingId: string, noteId: string, data: Partial<BishopricMeetingNote>, userId: string) => {
  const noteRef = doc(db, `bishopricMeetings/${meetingId}/notes`, noteId);
  await updateDoc(noteRef, {
    ...data,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
  await logAction(userId, 'update', 'bishopricNote', noteId, `MeetingID: ${meetingId}`);
};

export const deleteNoteFromMeeting = async (meetingId: string, noteId: string, userId: string) => {
  await deleteDoc(doc(db, `bishopricMeetings/${meetingId}/notes`, noteId));
  await logAction(userId, 'delete', 'bishopricNote', noteId, `MeetingID: ${meetingId}`);
};
