'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Venue, Station } from '@/types/venue';

interface BookingStats {
    totalTents: number;
    totalChairs: number;
    totalTables: number;
}

export async function getBookingStats(): Promise<BookingStats> {
    let totalTents = 0;
    let totalChairs = 0;
    let totalTables = 0;

    try {
        const sectionsRef = collection(db, 'sections');
        const snapshot = await getDocs(sectionsRef);

        snapshot.docs.forEach((doc) => {
            const venue = doc.data() as Venue;
            const stations = venue.stations || [];

            stations.forEach((station) => {
                if (station.status === 'booked' && station.bookedBy) {
                    // Count Tent
                    totalTents += 1;

                    // Count Rentals
                    const rentals = station.bookedBy.rentals;
                    if (rentals) {
                        totalChairs += (rentals.chairs || 0);
                        totalTables += (rentals.tables || 0);
                    }
                }
            });
        });

        return {
            totalTents,
            totalChairs,
            totalTables
        };

    } catch (error) {
        console.error("Error fetching booking stats:", error);
        // Return zeros on error to avoid breaking the UI
        return {
            totalTents: 0,
            totalChairs: 0,
            totalTables: 0
        };
    }
}
