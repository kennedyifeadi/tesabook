import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Venue } from '@/types/venue';
import { releaseExpiredLocks } from '@/utils/cleanup';

export function useRealTimeSections() {
    const [sections, setSections] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Run cleanup on mount (lazy cleanup)
    useEffect(() => {
        releaseExpiredLocks().catch(console.error);
    }, []);

    useEffect(() => {
        const q = query(collection(db, 'sections'), orderBy('name'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Venue[];

            // Sort by availability: Most free first, sold out last
            data.sort((a, b) => {
                const aAvailable = a.stations?.filter(s => s.status === 'available').length || 0;
                const bAvailable = b.stations?.filter(s => s.status === 'available').length || 0;

                // If both have 0 availability, sort by name
                if (aAvailable === 0 && bAvailable === 0) {
                    return a.name.localeCompare(b.name);
                }

                // If one has 0 availability, put it last
                if (aAvailable === 0) return 1;
                if (bAvailable === 0) return -1;

                // Otherwise sort by most available first
                return bAvailable - aAvailable;
            });

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
