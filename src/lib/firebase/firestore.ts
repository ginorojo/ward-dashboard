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
  orderBy,
  Firestore
} from 'firebase/firestore';
import type { UserProfile, Log, Interview, BishopricMeetingNote, SacramentMeeting, AsuntoBarrio } from '../types';

// Generic log function
export const logAction = async (
  firestore: Firestore,
  userId: string,
  action: Log['action'],
  entity: string,
  entityId: string,
  details: string = ''
) => {
  try {
    await addDoc(collection(firestore, 'logs'), {
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
export const getUsers = async (firestore: Firestore): Promise<UserProfile[]> => {
  const querySnapshot = await getDocs(collection(firestore, 'users'));
  return querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
};

export const updateUserProfile = async (firestore: Firestore, uid: string, data: Partial<UserProfile>) => {
  const userRef = doc(firestore, 'users', uid);
  await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteUserAndProfile = async (firestore: Firestore, uid: string) => {
  // Note: Deleting from Firebase Auth requires a backend environment (Cloud Function).
  // This function will only delete the Firestore user profile.
  // The user should be deactivated instead of deleted from the UI for full safety.
  await deleteDoc(doc(firestore, 'users', uid));
};


// Generic Firestore Functions
export const getCollection = async <T>(firestore: Firestore, collectionName: string, order?: {field: string, direction?: "asc" | "desc"}): Promise<T[]> => {
    const collRef = collection(firestore, collectionName);
    const q = order ? query(collRef, orderBy(order.field, order.direction || 'desc')) : collRef;
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

export const getDocument = async <T>(firestore: Firestore, collectionName: string, id: string): Promise<T | null> => {
    const docRef = doc(firestore, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
};


export const addDocument = async <T>(firestore: Firestore, collectionName: string, data: T, userId: string, entityName: string): Promise<string> => {
    const docRef = await addDoc(collection(firestore, collectionName), {
        ...data,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedBy: userId,
        updatedAt: serverTimestamp(),
    });
    await logAction(firestore, userId, 'create', entityName, docRef.id, JSON.stringify(data));
    return docRef.id;
};

export const updateDocument = async <T>(firestore: Firestore, collectionName: string, id: string, data: Partial<T>, userId: string, entityName: string) => {
    const docRef = doc(firestore, collectionName, id);
    await updateDoc(docRef, {
        ...data,
        updatedBy: userId,
        updatedAt: serverTimestamp(),
    });
    await logAction(firestore, userId, 'update', entityName, id, JSON.stringify(data));
};

export const deleteDocument = async (firestore: Firestore, collectionName: string, id: string, userId: string, entityName: string) => {
    const docRef = doc(firestore, collectionName, id);
    await deleteDoc(docRef);
    await logAction(firestore, userId, 'delete', entityName, id);
};

// Specific for Bishopric Meeting Notes (subcollection)
export const getNotesForMeeting = async (firestore: Firestore, meetingId: string): Promise<BishopricMeetingNote[]> => {
  const notesRef = collection(firestore, `bishopricMeetings/${meetingId}/notes`);
  const q = query(notesRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), meetingId } as BishopricMeetingNote));
};

export const addNoteToMeeting = async (firestore: Firestore, meetingId: string, data: Omit<BishopricMeetingNote, 'id' | 'createdAt' | 'updatedAt' | 'meetingId'>, userId: string) => {
  const noteRef = await addDoc(collection(firestore, `bishopricMeetings/${meetingId}/notes`), {
    ...data,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
  await logAction(firestore, userId, 'create', 'bishopricNote', noteRef.id, `MeetingID: ${meetingId}`);
  return noteRef.id;
};

export const updateNoteInMeeting = async (firestore: Firestore, meetingId: string, noteId: string, data: Partial<BishopricMeetingNote>, userId: string) => {
  const noteRef = doc(firestore, `bishopricMeetings/${meetingId}/notes`, noteId);
  await updateDoc(noteRef, {
    ...data,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
  await logAction(firestore, userId, 'update', 'bishopricNote', noteId, `MeetingID: ${meetingId}`);
};

export const deleteNoteFromMeeting = async (firestore: Firestore, meetingId: string, noteId: string, userId: string) => {
  await deleteDoc(doc(firestore, `bishopricMeetings/${meetingId}/notes`, noteId));
  await logAction(firestore, userId, 'delete', 'bishopricNote', noteId, `MeetingID: ${meetingId}`);
};
