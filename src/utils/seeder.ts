import { db, validateConfig } from "@/lib/firebase";
import { seedVenues } from "@/data/venues";
import { doc, setDoc } from "firebase/firestore";

export async function seedDatabase() {
    try {
        validateConfig();
    } catch (e: any) {
        return [{ name: 'Config Check', status: 'error', error: e.message }];
    }

    const results = [];
    for (const venue of seedVenues) {
        const slug = venue.name.toLowerCase().replace(/\s+/g, '-');
        const stations = Array.from({ length: venue.capacity }, (_, i) => ({
            id: (i + 1).toString(),
            status: 'available'
        }));

        try {
            const timeout = new Promise((_, reject) => setTimeout(() => reject('Timeout: Firestore write took too long'), 5000));

            await Promise.race([
                setDoc(doc(db, "sections", slug), {
                    name: venue.name,
                    capacity: venue.capacity,
                    stations: stations
                }),
                timeout
            ]);
            results.push({ name: venue.name, status: 'success' });
        } catch (error) {
            console.error(`Error seeding ${venue.name}:`, error);
            results.push({ name: venue.name, status: 'error', error });
        }
    }
    return results;
}
