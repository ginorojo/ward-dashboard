
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
import type { UserProfile, Log, Interview, MeetingNote, SacramentMeeting, AsuntoBarrio } from '../types';
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

// Generic Firestore Functions for Reads
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


// Non-blocking Firestore Write Operations
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
        throw serverError;
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

    await updateDoc(docRef, updateData)
      .catch(serverError => {
          const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'update',
              requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw serverError;
      });
      
    await logAction(firestore, userId, 'update', entityName, id, JSON.stringify(data));
};

export const deleteDocument = async (firestore: Firestore, collectionName: string, id: string, userId: string, entityName: string) => {
    const docRef = doc(firestore, collectionName, id);
    await deleteDoc(docRef)
      .catch(serverError => {
          const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
          throw serverError;
      });

    await logAction(firestore, userId, 'delete', entityName, id);
};


// User Management
export const getUsers = async (firestore: Firestore): Promise<UserProfile[]> => {
  const querySnapshot = await getDocs(collection(firestore, 'users'));
  return querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
};

export const updateUserProfile = async (firestore: Firestore, uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(firestore, 'users', uid);
  const updateData = { ...data, updatedAt: serverTimestamp() };
  return updateDoc(userRef, updateData)
    .catch(serverError => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updateData
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
};

export const deleteUser = async (firestore: Firestore, uid: string): Promise<void> => {
    const userRef = doc(firestore, 'users', uid);
    return deleteDoc(userRef).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'delete'
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
};

// Meeting Notes Specific
export const getMeetingNotes = async (firestore: Firestore): Promise<MeetingNote[]> => {
  return getCollection<MeetingNote>(firestore, 'meetingNotes', { field: 'date', direction: 'desc' });
};

export const saveMeetingNote = async (firestore: Firestore, data: any, userId: string, id?: string) => {
  if (id) {
    return updateDocument(firestore, 'meetingNotes', id, data, userId, 'meetingNote');
  } else {
    return addDocument(firestore, 'meetingNotes', data, userId, 'meetingNote');
  }
};

export const deleteMeetingNote = async (firestore: Firestore, id: string, userId: string) => {
  return deleteDocument(firestore, 'meetingNotes', id, userId, 'meetingNote');
};
