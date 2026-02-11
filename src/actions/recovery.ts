'use server';

import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Venue, Station } from "@/types/venue";
import { sendReceipt } from "@/lib/email";

export async function recoverOyewaleBooking() {
    const venueSlug = 'nlng-back';
    const stationId = '9';
    const venueRef = doc(db, 'sections', venueSlug);

    try {
        console.log(`Starting recovery for ${venueSlug} - Seat ${stationId}...`);

        const snap = await getDoc(venueRef);
        if (!snap.exists()) {
            return { success: false, error: "Venue nlng-back not found" };
        }

        const venueData = snap.data() as Venue;
        const stations = venueData.stations || [];

        // Check if station 9 exists
        const stationIndex = stations.findIndex(s => s.id === stationId);
        if (stationIndex === -1) {
            return { success: false, error: "Station 9 not found in nlng-back" };
        }

        // Prepare the updated station object
        // Keeping status 'booked' as user said it's already set manually
        const updatedStation: Station = {
            ...stations[stationIndex],
            status: 'booked',
            lockedAt: Date.now(), // update lock time to now just in case
            paymentReference: 'ER|A101AEDD326A4',
            bookedBy: {
                name: 'Oyewale Harry Ayooluwa',
                email: 'oyewaleharry@gmail.com',
                phone: '09077589174',
                matricNumber: '223181',
                tentName: 'The Oyewale Family',
                rentals: {
                    chairs: 1, // 1 Dozen
                    tables: 1
                },
                fees: {
                    base: 0, // Assuming 0 base for now or implicit in seat price
                    logistics: 3000,
                    rentalTotal: (1 * 2500) + (1 * 2000) // 2500 + 2000 = 4500
                    // Seat is 6500. Total = 6500 + 4500 + 3000 = 14000. Correct.
                }
            }
        };

        // Update the array locally
        stations[stationIndex] = updatedStation;

        // Save to Firestore
        await updateDoc(venueRef, { stations });
        console.log("Database updated successfully.");

        // Send Receipt
        await sendReceipt({
            email: 'oyewaleharry@gmail.com',
            name: 'Oyewale Harry Ayooluwa',
            bookingDetails: [`${venueData.name} - Seat ${stationId}`],
            transactionRef: 'ER|A101AEDD326A4',
            amount: 14000,
            date: 'February 05, 2026', // As requested
            chairs: 1,
            tables: 1,
            baseFee: 0,
            logisticsFee: 3000,
            tentName: 'The Oyewale Family'
        });

        console.log("Recovery Email sent.");
        return { success: true, message: "Booking recovered and receipt sent for Oyewale Harry Ayooluwa." };

    } catch (error: any) {
        console.error("Recovery failed:", error);
        return { success: false, error: error.message };
    }
}

export async function recoverBankoleBooking() {
    const venueSlug = 'elect-tarmac';
    const stationId = '1';
    const venueRef = doc(db, 'sections', venueSlug);

    try {
        console.log(`Starting recovery for ${venueSlug} - Seat ${stationId}...`);

        const snap = await getDoc(venueRef);
        if (!snap.exists()) {
            return { success: false, error: "Venue elect-tarmac not found" };
        }

        const venueData = snap.data() as Venue;
        const stations = venueData.stations || [];

        // Check if station 1 exists
        const stationIndex = stations.findIndex(s => s.id === stationId);
        if (stationIndex === -1) {
            return { success: false, error: "Station 1 not found in elect-tarmac" };
        }

        // Prepare the updated station object
        const updatedStation: Station = {
            ...stations[stationIndex],
            status: 'booked',
            lockedAt: Date.now(),
            paymentReference: 'ER|A101E1388ADE4',
            bookedBy: {
                name: 'Bankole Babatunde Timothy',
                email: 'bankoletimothy18@gmail.com',
                phone: '07052322544',
                matricNumber: '223255',
                tentName: "Bankole's Family",
                rentals: {
                    chairs: 2, // 2 Dozens
                    tables: 0
                },
                fees: {
                    base: 0,
                    logistics: 3000,
                    rentalTotal: (2 * 2500) // 5000
                    // Total = 6500 (Tent) + 5000 (Chairs) + 3000 (Logistics) = 14500. Correct.
                }
            }
        };

        // Update the array locally
        stations[stationIndex] = updatedStation;

        // Save to Firestore
        await updateDoc(venueRef, { stations });
        console.log("Database updated successfully for Bankole.");

        // Send Receipt
        await sendReceipt({
            email: 'bankoletimothy18@gmail.com',
            name: 'Bankole Babatunde Timothy',
            bookingDetails: [`${venueData.name} - Seat ${stationId}`],
            transactionRef: 'ER|A101E1388ADE4',
            amount: 14500,
            date: 'February 05, 2026',
            chairs: 2,
            tables: 0,
            baseFee: 0,
            logisticsFee: 3000,
            tentName: "Bankole's Family"
        });

        console.log("Recovery Email sent for Bankole.");
        return { success: true, message: "Booking recovered and receipt sent for Bankole Babatunde Timothy." };

    } catch (error: any) {
        console.error("Recovery failed:", error);
        return { success: false, error: error.message };
    }
}
