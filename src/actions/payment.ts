'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
import { Station, Venue } from '@/types/venue';
import { sendReceipt } from '@/lib/email';

interface VerifyResult {
    success: boolean;
    data?: any;
    error?: string;
    stationsBooked?: string[];
}

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
    if (!reference) return { success: false, error: "No reference provided" };

    try {
        // 1. Verify with Ercas
        const response = await fetch(`https://api.ercaspay.com/v1/payment/transaction/verify/${reference}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.ERCAS_SECRET_KEY}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        const isPaymentSuccessful = response.ok && (data.responseBody?.status === 'success' || data.status === 'success' || data.responseBody?.paymentStatus === 'PAID');

        // 2. Find relevant DB records
        const sectionsRef = collection(db, 'sections');
        const snapshot = await getDocs(sectionsRef);

        const batch = writeBatch(db);
        let foundStations = false;
        const bookedStationIds: string[] = [];

        snapshot.docs.forEach(docSnap => {
            const venue = docSnap.data() as Venue;
            const stations = venue.stations || [];

            // Find stations with matching ref
            const stationsToUpdate = stations.filter(s => s.paymentReference === reference);

            if (stationsToUpdate.length > 0) {
                foundStations = true;
                const newStations = stations.map(s => {
                    if (s.paymentReference === reference) {
                        bookedStationIds.push(`${venue.name} - Seat ${s.id}`);
                        return {
                            ...s,
                            status: isPaymentSuccessful ? 'booked' : 'available',
                            lockedAt: isPaymentSuccessful ? s.lockedAt : undefined,
                            lockedBy: isPaymentSuccessful ? s.lockedBy : undefined,
                            paymentReference: isPaymentSuccessful ? s.paymentReference : undefined
                        } as Station;
                    }
                    return s;
                });

                batch.update(docSnap.ref, { stations: newStations });
            }
        });

        if (!foundStations) {
            return { success: false, error: "No booking found for this reference" };
        }

        await batch.commit();

        if (isPaymentSuccessful) {
            try {
                // Find email from one of the booked stations
                // We need to look at the snapshot again or just carry over the 'lockedBy' we saw earlier.
                // Since we iterated, let's just find it again from the snapshot wrapper we have in memory.
                const firstBookedStation = snapshot.docs
                    .flatMap(d => (d.data() as Venue).stations || [])
                    .find(s => s.paymentReference === reference);

                if (firstBookedStation && firstBookedStation.lockedBy) {
                    const amount = bookedStationIds.length * 6500;
                    const customerName = (data.responseBody?.customerName || data.customerName || "Valued Customer");

                    await sendReceipt({
                        email: firstBookedStation.lockedBy,
                        name: customerName,
                        bookingDetails: bookedStationIds,
                        transactionRef: reference,
                        amount: amount,
                        date: new Date().toLocaleDateString()
                    });
                }
            } catch (emailErr) {
                console.error("Failed to send receipt:", emailErr);
            }

            return { success: true, stationsBooked: bookedStationIds, data: data.responseBody || data };
        } else {
            return { success: false, error: "Payment verification failed or was declined." };
        }

    } catch (e: any) {
        console.error("Verification Error:", e);
        return { success: false, error: e.message };
    }
}
