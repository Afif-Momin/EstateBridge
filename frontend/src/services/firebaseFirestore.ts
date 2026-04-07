import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import type {
  QueryConstraint,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Subscribe to a Firestore collection with optional query constraints.
 * Returns an unsubscribe function.
 */
export function subscribeToCollection<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[],
  onData: (data: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
      onData(data);
    },
    onError
  );
}

/**
 * Subscribe to a single Firestore document.
 */
export function subscribeToDocument<T extends DocumentData>(
  collectionName: string,
  docId: string,
  onData: (data: T | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ref = doc(db, collectionName, docId);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (snapshot.exists()) {
        onData({ id: snapshot.id, ...snapshot.data() } as unknown as T);
      } else {
        onData(null);
      }
    },
    onError
  );
}

export { where };
