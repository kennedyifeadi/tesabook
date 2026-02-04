import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Venue, Station } from "@/types/venue";

export async function migrateNFLT() {
    console.log("Starting NFLT Capacity Swap (Front: 10, Back: 20)...");

    try {
        // 1. NFLT Front: Capacity -> 10
        const frontRef = doc(db, 'sections', 'nflt-front');
        const frontSnap = await getDoc(frontRef);

        if (frontSnap.exists()) {
            const frontData = frontSnap.data() as Venue;
            const currentStations = frontData.stations || [];

            if (currentStations.length > 10) {
                // Shrinking to 10
                const keptStations = currentStations.slice(0, 10);
                await updateDoc(frontRef, {
                    capacity: 10,
                    stations: keptStations
                });
                console.log(`Updated NFLT Front: Capacity 10, removed ${currentStations.length - 10} stations.`);
            } else {
                console.log(`NFLT Front has ${currentStations.length} stations. Ensuring capacity is 10.`);
                // If less than 10, we could add, but usually it's just a shrink/expand. 
                // If it was 20 (from previous error), it will shrink.
                await updateDoc(frontRef, { capacity: 10 });
            }
        } else {
            console.warn("NFLT Front not found.");
        }

        // 2. NFLT Back: Capacity -> 20
        const backRef = doc(db, 'sections', 'nflt-back');
        const backSnap = await getDoc(backRef);

        if (backSnap.exists()) {
            const backData = backSnap.data() as Venue;
            const currentStations = backData.stations || [];

            if (currentStations.length < 20) {
                // Expanding to 20
                const newStationsNeeded = 20 - currentStations.length;
                const newStations: Station[] = Array.from({ length: newStationsNeeded }, (_, i) => ({
                    id: (currentStations.length + i + 1).toString(),
                    status: 'available'
                }));

                await updateDoc(backRef, {
                    capacity: 20,
                    stations: [...currentStations, ...newStations]
                });
                console.log(`Updated NFLT Back: Capacity 20, added ${newStationsNeeded} stations.`);
            } else {
                console.log(`NFLT Back already has ${currentStations.length} stations. Updating capacity to 20.`);
                await updateDoc(backRef, { capacity: 20 });
            }
        } else {
            console.warn("NFLT Back not found.");
        }

        return { success: true, message: "NFLT Capacities Updated: Front 10, Back 20" };

    } catch (error) {
        console.error("NFLT Migration failed:", error);
        return { success: false, error };
    }
}
