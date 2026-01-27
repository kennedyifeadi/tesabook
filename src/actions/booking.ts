'use server';

import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { Station, Venue } from '@/types/venue';

const STATION_PRICE = 6500;

interface BookingResult {
    success: boolean;
    paymentUrl?: string;
    error?: string;
}

export async function initiateBooking(formData: FormData, selectedStations: string[]): Promise<BookingResult> {
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;

    if (!email || !name || selectedStations.length === 0) {
        return { success: false, error: "Missing required fields" };
    }

    const totalAmount = selectedStations.length * STATION_PRICE;

    try {
        // Generate Reference First to save in DB
        const paymentReference = `TESA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        await runTransaction(db, async (transaction) => {
            // 1. Group selections by venue to minimize reads
            const venueReads: { [slug: string]: string[] } = {};
            selectedStations.forEach(id => {
                const [slug, stationId] = id.split('::');
                if (!venueReads[slug]) venueReads[slug] = [];
                venueReads[slug].push(stationId);
            });

            // 2. Read and Validate
            for (const [slug, stationIds] of Object.entries(venueReads)) {
                const venueRef = doc(db, 'sections', slug);
                const venueDoc = await transaction.get(venueRef);

                if (!venueDoc.exists()) throw new Error(`Venue ${slug} not found`);

                const venueData = venueDoc.data() as Venue;
                const stations = venueData.stations || [];

                // Check availability
                for (const stationId of stationIds) {
                    const station = stations.find(s => s.id === stationId);
                    if (!station) throw new Error(`Station ${stationId} not found`);

                    if (station.status !== 'available') {
                        throw new Error(`Station ${stationId} in ${slug} is no longer available.`);
                    }
                }
            }

            // 3. Update (Locking)
            for (const [slug, stationIds] of Object.entries(venueReads)) {
                const venueRef = doc(db, 'sections', slug);
                const venueDoc = await transaction.get(venueRef);
                const venueData = venueDoc.data() as Venue;
                const stations = venueData.stations || [];

                const updatedStations = stations.map(s => {
                    if (stationIds.includes(s.id)) {
                        return {
                            ...s,
                            status: 'pending',
                            lockedAt: Date.now(),
                            lockedBy: email,
                            paymentReference: paymentReference
                        } as Station;
                    }
                    return s;
                });

                transaction.update(venueRef, { stations: updatedStations });
            }
        });

        // 4. Ercas Pay Integration
        const response = await fetch('https://api.ercaspay.com/v1/payment/initiate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.ERCAS_SECRET_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                amount: totalAmount,
                paymentReference: paymentReference,
                paymentMethods: "card,bank-transfer,ussd",
                customerName: name,
                customerEmail: email,
                redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/callback`,
                currency: "NGN"
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Ercas Error:", data);
            return { success: false, error: data.message || "Payment initialization failed" };
        }

        return { success: true, paymentUrl: data.responseBody?.checkoutUrl || data.checkoutUrl };

    } catch (e: any) {
        console.error("Booking Error:", e);
        return { success: false, error: e.message };
    }
}
