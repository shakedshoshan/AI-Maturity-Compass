'use client';

import { useState, useEffect } from 'react';
import type { DocumentReference, DocumentData } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';

interface DocData<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useDoc<T>(
  docRef: DocumentReference<DocumentData> | null
): DocData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docRef) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error };
}
