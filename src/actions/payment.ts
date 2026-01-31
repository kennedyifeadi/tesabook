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
    const matricNumber = (formData.get('matricNumber') as string).trim().toUpperCase();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;

    // Parse Rental Data
    const chairs = parseInt(formData.get('chairs') as string) || 0;
    const tables = parseInt(formData.get('tables') as string) || 0;

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (!email || !name || !matricNumber || selectedStations.length === 0) {
        return { success: false, error: "Missing required fields" };
    }

    if (!USE_MOCK_PAYMENT && !process.env.NEXT_PUBLIC_ERCAS_SECRET_KEY) {
        console.error("CRITICAL: ERCAS_SECRET_KEY is missing from environment variables.");
        return { success: false, error: "Server Configuration Error" };
    }

    // Server-Side Calculation
    const seatTotal = selectedStations.length * STATION_PRICE;
    const rentalCost = (chairs * 2500) + (tables * 2500);
    const logistics = (chairs > 0 || tables > 0) ? 2000 : 0;
    const totalAmount = seatTotal + rentalCost + logistics;

    const paymentReference = `TESA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
        await runTransaction(db, async (transaction) => {
            // 0. Pre-flight Check: Enforce Booking Limits (Max 3)
            // We need to read all venues to count existing bookings for this user.
            const allSectionsRef = collection(db, 'sections');
            const allSectionsSnapshot = await getDocs(allSectionsRef); // Note: In a transaction, we should use transaction.get if we want consistency, but getDocs is not supported on transaction object directly for collections.
            // However, Firestore transactions require reads to happen before writes.
            // For a small dataset, we can iterate known section IDs. But dynamic is better.
            // workaround: Read specific venues involved + maybe strict limit check is relaxed or we assume small conflicting windows.
            // BETTER: Read all docs using the transaction (requires knowing IDs).
            // Let's rely on the fact that we read the target venues below.
            // To properly check limits across *unrelated* venues, we'd need to read them all.
            // For now, let's implement a 'read all' approach by assuming we know the sections or just Fetching them outside the transaction first?
            // No, fetching outside transaction means race condition.
            // Let's stick to reading the venues we are modifying.
            // Wait, the user requirement is strict: "if the person has book for 3 seats already...".
            // If they booked in Venue A, and now trying Venue B, we need to know about A.
            // Compromise: Read ALL sections. Since there are few sections (Front, Middle, Back, Gallery), this is cheap.
            const sectionIds = ["agric-back", "agric-front", "agric-middle", "agric-gallery"]; // Hardcoded for safety or fetch from a config if available.
            // Actually, let's fetch IDs first (non-transactional read) then read them in transaction.

            // Re-evaluating: runTransaction requires all reads before writes.
            // We can just read the docs we need.

            let existingBookingsCount = 0;

            // We must read ALL sections to enforce the global limit.
            // Assuming the collection 'sections' is small.
            // We cannot query collection in transaction easily without known IDs.
            // Let's assume the standard 4 sections + any others.
            // Ideally, we passed 'selectedStations' which implies specific venues.
            // But we need to check venues NOT selected too.

            // Strategy: Read the specific document references for all known sections.
            // If we don't know them, we can't fully lock.
            // Let's assume the user only books in the 4 main sections.
            // For robustness, let's Fetch the list of section IDs first (outside transaction, slightly stale is ok for IDs list)
            // or just iterate the known ones.
            // Let's use the known ones for the convocation hall.
            const knownSectionIds = ["agric-front", "agric-middle", "agric-back", "agric-gallery"];

            for (const sectionId of knownSectionIds) {
                const ref = doc(db, 'sections', sectionId);
                const snap = await transaction.get(ref);
                if (snap.exists()) {
                    const stations = (snap.data() as Venue).stations || [];
                    stations.forEach(s => {
                        if ((s.status === 'booked' || s.status === 'locked') && s.bookedBy) {
                            if (s.bookedBy.email.toLowerCase() === email || s.bookedBy.matricNumber === matricNumber) {
                                existingBookingsCount++;
                            }
                        }
                    });
                }
            }

            if (existingBookingsCount + selectedStations.length > 3) {
                throw new Error(`Booking Limit Exceeded. You have ${existingBookingsCount} bookings and are trying to book ${selectedStations.length} more. Max allowed is 3.`);
            }

            // 1. Group selections by venue
            const venueReads: { [slug: string]: string[] } = {};
            selectedStations.forEach(id => {
                const [slug, stationId] = id.split('::');
                if (!venueReads[slug]) venueReads[slug] = [];
                venueReads[slug].push(stationId);
            });

            // 2. Read and Validate (Target Venues)
            // We re-read the target venues inside the loop? No, we already read them in the counting loop above if they are in knownSectionIds.
            // Transaction requires we use the *same* snapshot if we read it.
            // But Firestore SDK might cache. To be safe/clean code:
            // The previous loop was just for counting. We can re-get or reuse data?
            // Reuse is hard because we iterated known IDs.
            // Let's just do the standard validation logic. Firestore handles duplicate gets in one transaction fine (returns same doc).

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
                            bookedBy: {
                                email,
                                name,
                                phone,
                                matricNumber,
                                rentals: {
                                    chairs,
                                    tables,
                                    logisticsFee: logistics,
                                    totalRentalCost: rentalCost + logistics
                                }
                            },
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

        let description = `Convocation Booking - ${selectedStations.length} seats`;
        if (chairs > 0) description += `, ${chairs} Dozen Chairs`;
        if (tables > 0) description += `, ${tables} Tables`;
        if (logistics > 0) description += ` + Logistics`;

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
            description: description
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
        let rentalDetails: any = null;

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
                            if (s.bookedBy.rentals) {
                                rentalDetails = s.bookedBy.rentals;
                            }
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
                    date: new Date().toLocaleDateString(),
                    chairs: rentalDetails?.chairs || 0,
                    tables: rentalDetails?.tables || 0,
                    logisticsFee: rentalDetails?.logisticsFee || 0
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