'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyTransaction } from '@/actions/payment';

function CallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your payment...');
    const [bookingDetails, setBookingDetails] = useState<any>(null);

    useEffect(() => {
        const verify = async () => {
            // 1. Get both references from the URL
            const reference = searchParams.get('reference'); // Your TESA- ID
            const ercasRef = searchParams.get('transRef');   // The ER| ID (Required for verification)

            if (!reference) {
                setStatus('error');
                setMessage('Missing payment reference');
                return;
            }

            try {
                // 2. Pass BOTH to the server action
                // We prioritize ercasRef because that's what their API wants
                const result = await verifyTransaction(reference, ercasRef || undefined);

                if (result.success) {
                    setStatus('success');
                    setBookingDetails(result.data);
                    // Optional: Redirect after 5 seconds
                    // setTimeout(() => router.push('/'), 5000); 
                } else {
                    setStatus('error');
                    setMessage(result.error || 'Payment verification failed');
                }
            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage('An unexpected error occurred');
            }
        };

        verify();
    }, [searchParams, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-slate-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-slate-800">Verifying Payment</h2>
                    <p className="text-slate-500 mt-2">Please wait while we confirm your booking...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full border-t-4 border-red-500">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Failed</h2>
                    <p className="text-slate-600 mb-6">{message}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full border-t-4 border-green-500">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Booking Confirmed!</h2>
                <p className="text-slate-600 mb-6">
                    Thank you! Your seat has been successfully reserved. A receipt has been sent to your email.
                </p>
                <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left text-sm text-slate-600">
                    <p><span className="font-semibold">Amount Paid:</span> ₦{bookingDetails?.amount?.toLocaleString()}</p>
                    <p><span className="font-semibold">Ref:</span> {bookingDetails?.transactionReference}</p>
                </div>
                <button
                    onClick={() => router.push('/')}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                    Return to Home
                </button>
            </div>
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}