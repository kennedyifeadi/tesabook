import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Venue } from '@/types/venue';

export function useRealTimeSections() {
    const [sections, setSections] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'sections'), orderBy('name'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Venue[];
            setSections(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching sections:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { sections, loading, error };
}
