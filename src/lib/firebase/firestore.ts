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
  Firestore,
  SetOptions
} from 'firebase/firestore';
import type { UserProfile, Log, Interview, BishopricMeetingNote, SacramentMeeting, AsuntoBarrio } from '../types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Generic log function
export const logAction = async (
  firestore: Firestore,
  userId: string,
  action: Log['action'],
  entity: string,
  entityId: string,
  details: string = ''
) => {
  const logData = {
    userId,
    action,
    entity,
    entityId,
    details,
    timestamp: serverTimestamp(),
  };
  addDoc(collection(firestore, 'logs'), logData)
    .catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: 'logs',
            operation: 'create',
            requestResourceData: logData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
};

// Generic Firestore Functions for Reads (can still throw if rules disallow reads)
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


// Non-blocking Firestore Write Operations with Contextual Error Handling
export const addDocument = async <T>(firestore: Firestore, collectionName: string, data: T, userId: string, entityName: string): Promise<string> => {
    const docData = {
        ...data,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedBy: userId,
        updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(firestore, collectionName), docData)
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: collectionName,
            operation: 'create',
            requestResourceData: docData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Re-throw to allow component-level handling if needed
      });
      
    await logAction(firestore, userId, 'create', entityName, docRef.id, JSON.stringify(data));
    return docRef.id;
};

export const updateDocument = async <T>(firestore: Firestore, collectionName: string, id: string, data: Partial<T>, userId: string, entityName: string) => {
    const docRef = doc(firestore, collectionName, id);
    const updateData = {
        ...data,
        updatedBy: userId,
        updatedAt: serverTimestamp(),
    };

    updateDoc(docRef, updateData)
      .catch(serverError => {
          const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'update',
              requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
      });
      
    await logAction(firestore, userId, 'update', entityName, id, JSON.stringify(data));
};

export const deleteDocument = async (firestore: Firestore, collectionName: string, id: string, userId: string, entityName: string) => {
    const docRef = doc(firestore, collectionName, id);
    deleteDoc(docRef)
      .catch(serverError => {
          const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
      });

    await logAction(firestore, userId, 'delete', entityName, id);
};


// User Management (Read operations are async, write is non-blocking)
export const getUsers = async (firestore: Firestore): Promise<UserProfile[]> => {
  const querySnapshot = await getDocs(collection(firestore, 'users'));
  return querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
};

export const updateUserProfile = (firestore: Firestore, uid: string, data: Partial<UserProfile>) => {
  const userRef = doc(firestore, 'users', uid);
  const updateData = { ...data, updatedAt: serverTimestamp() };
  updateDoc(userRef, updateData)
    .catch(serverError => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updateData
      });
      errorEmitter.emit('permission-error', permissionError);
    });
};


// Specific for Bishopric Meeting Notes (subcollection)
export const getNotesForMeeting = async (firestore: Firestore, meetingId: string): Promise<BishopricMeetingNote[]> => {
  const notesRef = collection(firestore, `bishopricMeetings/${meetingId}/notes`);
  const q = query(notesRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), meetingId } as BishopricMeetingNote));
};

export const addNoteToMeeting = async (firestore: Firestore, meetingId: string, data: Omit<BishopricMeetingNote, 'id' | 'createdAt' | 'updatedAt' | 'meetingId'>, userId: string) => {
  const notesRef = collection(firestore, `bishopricMeetings/${meetingId}/notes`);
  const noteData = {
    ...data,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  };
  
  const noteRef = await addDoc(notesRef, noteData)
    .catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: notesRef.path,
            operation: 'create',
            requestResourceData: noteData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });

  await logAction(firestore, userId, 'create', 'bishopricNote', noteRef.id, `MeetingID: ${meetingId}`);
  return noteRef.id;
};

export const updateNoteInMeeting = (firestore: Firestore, meetingId: string, noteId: string, data: Partial<BishopricMeetingNote>, userId: string) => {
  const noteRef = doc(firestore, `bishopricMeetings/${meetingId}/notes`, noteId);
  const noteData = {
    ...data,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  };

  updateDoc(noteRef, noteData)
    .catch(serverError => {
      const permissionError = new FirestorePermissionError({
        path: noteRef.path,
        operation: 'update',
        requestResourceData: noteData
      });
      errorEmitter.emit('permission-error', permissionError);
    });

  logAction(firestore, userId, 'update', 'bishopricNote', noteId, `MeetingID: ${meetingId}`);
};

export const deleteNoteFromMeeting = (firestore: Firestore, meetingId: string, noteId: string, userId: string) => {
  const noteRef = doc(firestore, `bishopricMeetings/${meetingId}/notes`, noteId);
  deleteDoc(noteRef)
    .catch(serverError => {
      const permissionError = new FirestorePermissionError({
          path: noteRef.path,
          operation: 'delete'
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  logAction(firestore, userId, 'delete', 'bishopricNote', noteId, `MeetingID: ${meetingId}`);
};
