import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

export async function migrateVenue() {
    console.log("Starting migration: 'Civil Front' -> 'Ftech tarmac'");

    const oldSlug = 'civil-front';
    const newSlug = 'ftech-tarmac';
    const newName = 'Ftech tarmac';
    const newCapacity = 10;

    try {
        // 1. Check if old venue exists
        const oldRef = doc(db, 'sections', oldSlug);
        const oldSnap = await getDoc(oldRef);

        if (!oldSnap.exists()) {
            console.log(`Note: Old venue '${oldSlug}' not found. It might have been deleted already.`);
            // Continue to ensure new one exists
        } else {
            console.log(`Found old venue: ${oldSlug}`);
        }

        // 2. Create new venue
        const newRef = doc(db, 'sections', newSlug);
        const stations = Array.from({ length: newCapacity }, (_, i) => ({
            id: (i + 1).toString(),
            status: 'available'
        }));

        await setDoc(newRef, {
            name: newName,
            capacity: newCapacity,
            stations: stations
        });
        console.log(`Created new venue: ${newName} (${newSlug}) with ${newCapacity} stations.`);

        // 3. Delete old venues if they exist
        const venuesToDelete = [oldSlug, 'new-civil'];

        for (const slug of venuesToDelete) {
            const ref = doc(db, 'sections', slug);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                await deleteDoc(ref);
                console.log(`Deleted old venue: ${slug}`);
            } else {
                console.log(`Note: Venue '${slug}' not found (already deleted?).`);
            }
        }

        return { success: true, message: `Migrated to Ftech tarmac and cleaned up old venues successfully.` };

    } catch (error) {
        console.error("Migration failed:", error);
        return { success: false, error };
    }
}
