'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch, runTransaction } from 'firebase/firestore';
import { Station, Venue } from '@/types/venue';
import { sendReceipt } from '@/lib/email';

const STATION_PRICE = 6500;
// Use the Staging URL for testing. Switch to 'api.ercaspay.com' only when going live.
const ERCAS_BASE_URL = 'https://api-staging.ercaspay.com/api/v1';

const USE_MOCK_PAYMENT = false; // Set to false to use real Ercas API

interface BookingResult {
    success: boolean;
    paymentUrl?: string;
    error?: string;
}

interface VerifyResult {
    success: boolean;
    data?: any;
    error?: string;
    stationsBooked?: string[];
}

export async function initiateBooking(formData: FormData, selectedStations: string[]): Promise<BookingResult> {
    const email = (formData.get('email') as string).trim().toLowerCase();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (!email || !name || selectedStations.length === 0) {
        return { success: false, error: "Missing required fields" };
    }

    if (!USE_MOCK_PAYMENT && !process.env.NEXT_PUBLIC_ERCAS_SECRET_KEY) {
        console.error("CRITICAL: ERCAS_SECRET_KEY is missing from environment variables.");
        return { success: false, error: "Server Configuration Error" };
    }

    const totalAmount = selectedStations.length * STATION_PRICE;
    const paymentReference = `TESA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Group selections by venue
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

                for (const stationId of stationIds) {
                    const station = stations.find(s => s.id === stationId);
                    if (!station) throw new Error(`Station ${stationId} not found`);

                    if (station.status !== 'available') {
                        throw new Error(`Station ${stationId} is no longer available.`);
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
                            status: 'locked',
                            lockedAt: Date.now(),
                            bookedBy: { email, name, phone },
                            paymentReference: paymentReference
                        } as Station;
                    }
                    return s;
                });

                transaction.update(venueRef, { stations: updatedStations });
            }
        });

        // --- MOCK MODE ---
        if (USE_MOCK_PAYMENT) {
            console.log("⚠️ MOCK MODE: Simulating payment initiation...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
                success: true,
                paymentUrl: `${BASE_URL}/payment/callback?transactionRef=${paymentReference}&mock=true`
            };
        }

        // 4. Ercas Pay Integration
        const payload = {
            amount: totalAmount,
            paymentReference: paymentReference,
            paymentMethods: "card,bank-transfer,ussd,qrcode",
            customerName: name,
            customerEmail: email,
            customerPhoneNumber: phone,
            redirectUrl: `${BASE_URL}/payment/callback`,
            currency: "NGN",
            description: `Convocation Booking - ${selectedStations.length} seats`
        };

        const targetUrl = `${ERCAS_BASE_URL}/payment/initiate`;
        console.log("DEBUG: Ercas URL:", targetUrl);
        // console.log("DEBUG: Auth Header:", `Bearer ${process.env.NEXT_PUBLIC_ERCAS_SECRET_KEY?.substring(0, 5)}...`);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ERCAS_SECRET_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const rawText = await response.text();
        // console.log("DEBUG: Raw Response Body:", rawText.substring(0, 500));

        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            console.error("DEBUG: Failed to parse JSON:", e);
            console.error("DEBUG: HTML Content snippet:", rawText.substring(0, 200));
            return { success: false, error: `API returned HTML instead of JSON. See server logs for details.` };
        }

        if (!response.ok || !data.requestSuccessful) {
            console.log("DEBUG: Ercas Payment Failed");
            console.log("DEBUG: Response Status:", response.status, response.statusText);
            console.error("Ercas Init Error:", data);
            return { success: false, error: data.responseMessage || "Payment initialization failed" };
        }

        return { success: true, paymentUrl: data.responseBody.checkoutUrl };

    } catch (e: any) {
        console.error("Booking Error:", e);
        return { success: false, error: e.message };
    }
}

export async function verifyTransaction(merchantReference: string, ercasReference?: string): Promise<VerifyResult> {
    if (!merchantReference) return { success: false, error: "No reference provided" };

    try {
        let isPaymentSuccessful = false;
        let apiData: any = {};

        // 1. Verify (Mock or Real)
        if (USE_MOCK_PAYMENT) {
            console.log("⚠️ MOCK MODE: Simulating verification... Success!");
            await new Promise(resolve => setTimeout(resolve, 500));
            isPaymentSuccessful = true;
            apiData = {
                requestSuccessful: true,
                responseBody: {
                    amount: 13000,
                    customerName: "Mock Customer",
                    transactionStatus: "success"
                }
            };
        } else {
            const refToVerify = ercasReference || merchantReference;
            const verifyUrl = `${ERCAS_BASE_URL}/payment/transaction/verify/${refToVerify}`;
            console.log("DEBUG: Verifying at:", verifyUrl);

            const response = await fetch(verifyUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ERCAS_SECRET_KEY}`,
                    'Accept': 'application/json'
                }
            });

            console.log("DEBUG: Verify Status:", response.status);
            const rawText = await response.text();
            console.log("DEBUG: Verify Response Body:", rawText);

            try {
                const data = JSON.parse(rawText);
                apiData = data;

                // --- CRITICAL FIX: Handle Case Sensitivity ---
                // ErcasPay returns "SUCCESSFUL" (uppercase) but code was checking "success" (lowercase)
                const status = data.responseBody?.status?.toLowerCase() || '';
                const txStatus = data.responseBody?.transactionStatus?.toLowerCase() || '';
                const payStatus = data.responseBody?.paymentStatus?.toLowerCase() || '';

                isPaymentSuccessful = response.ok &&
                    data.requestSuccessful &&
                    (status === 'success' || status === 'successful' ||
                        txStatus === 'success' || txStatus === 'successful' ||
                        payStatus === 'success' || payStatus === 'successful');

            } catch (e) {
                console.error("DEBUG: Failed to parse Verify JSON:", e);
                isPaymentSuccessful = false;
            }
        }

        // 2. Find relevant DB records
        const sectionsRef = collection(db, 'sections');
        const snapshot = await getDocs(sectionsRef);

        const batch = writeBatch(db);
        let foundStations = false;
        const bookedStationIds: string[] = [];
        let purchaserEmail = '';
        let purchaserName = '';

        snapshot.docs.forEach(docSnap => {
            const venue = docSnap.data() as Venue;
            const stations = venue.stations || [];

            // Check if any station in this venue matches the reference
            const stationsToUpdate = stations.filter(s => s.paymentReference === merchantReference);

            if (stationsToUpdate.length > 0) {
                foundStations = true;

                const newStations = stations.map(s => {
                    if (s.paymentReference === merchantReference) {
                        bookedStationIds.push(`${venue.name} - Seat ${s.id}`);
                        if (s.bookedBy) {
                            purchaserEmail = s.bookedBy.email;
                            purchaserName = s.bookedBy.name;
                        }

                        if (isPaymentSuccessful) {
                            return {
                                ...s,
                                status: 'booked'
                            } as Station;
                        } else {
                            // Revert to available and safely remove booking fields
                            // Destructuring ensures we don't pass 'undefined' values to Firestore
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { lockedAt, lockedBy, bookedBy, paymentReference, ...rest } = s;
                            return {
                                ...rest,
                                status: 'available'
                            } as Station;
                        }
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
            // Send Email
            if (purchaserEmail) {
                await sendReceipt({
                    email: purchaserEmail,
                    name: purchaserName || apiData.responseBody?.customerName || "Customer",
                    bookingDetails: bookedStationIds,
                    transactionRef: merchantReference,
                    amount: apiData.responseBody?.amount || 0,
                    date: new Date().toLocaleDateString()
                });
            }

            return {
                success: true,
                stationsBooked: bookedStationIds,
                data: {
                    ...apiData.responseBody,
                    // Force the transaction reference to be available at the top level
                    transactionReference: merchantReference || apiData.responseBody?.tx_reference || apiData.responseBody?.paymentReference
                }
            };
        } else {
            return { success: false, error: "Payment verification failed or was declined." };
        }

    } catch (e: any) {
        console.error("Verification Error:", e);
        return { success: false, error: e.message };
    }
}