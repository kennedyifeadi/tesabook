import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Venue } from '@/types/venue';

const LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function releaseExpiredLocks() {
    try {
        const sectionsRef = collection(db, 'sections');
        const snapshot = await getDocs(sectionsRef);
        const batch = writeBatch(db);
        let updatesCount = 0;
        const now = Date.now();

        snapshot.docs.forEach(docSnap => {
            const venue = docSnap.data() as Venue;
            const stations = venue.stations || [];
            let needsUpdate = false;

            const newStations = stations.map(s => {
                // Check if pending AND expired
                if (s.status === 'pending' && s.lockedAt && (now - s.lockedAt > LOCK_TIMEOUT_MS)) {
                    needsUpdate = true;
                    return {
                        id: s.id,
                        status: 'available'
                        // Remove lockedAt, lockedBy, paymentReference by strictly setting fields or letting them be undefined
                    };
                }
                return s;
            });

            if (needsUpdate) {
                batch.update(docSnap.ref, { stations: newStations });
                updatesCount++;
            }
        });

        if (updatesCount > 0) {
            await batch.commit();
            console.log(`Released expired locks in ${updatesCount} venues.`);
        } else {
            console.log("No expired locks found.");
        }

        return { success: true, venuesUpdated: updatesCount };

    } catch (error) {
        console.error("Error releasing locks:", error);
        return { success: false, error };
    }
}
