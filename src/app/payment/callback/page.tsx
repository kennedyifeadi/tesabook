'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyTransaction } from '@/actions/payment';
import Link from 'next/link';

function CallbackContent() {
    const searchParams = useSearchParams();
    const reference = searchParams.get('transactionRef') || searchParams.get('reference');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying payment status...');
    const [bookingDetails, setBookingDetails] = useState<string[]>([]);

    const hasVerified = useRef(false);

    useEffect(() => {
        if (!reference) {
            setStatus('error');
            setMessage("Invalid callback URL. No transaction reference found.");
            return;
        }

        if (hasVerified.current) return;
        hasVerified.current = true;

        verifyTransaction(reference)
            .then(result => {
                if (result.success) {
                    setStatus('success');
                    setBookingDetails(result.stationsBooked || []);
                } else {
                    setStatus('error');
                    setMessage(result.error || "Payment verification failed.");
                }
            })
            .catch(err => {
                setStatus('error');
                setMessage(err.message);
            });
    }, [reference]);

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-semibold text-slate-800">Verifying Booking...</h2>
                <p className="text-slate-500 mt-2">Please wait while we confirm your payment.</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
                <p className="text-slate-600 mb-6">Your payment was successful and your seats have been reserved.</p>

                <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Reserved Seats</h3>
                    <ul className="space-y-1">
                        {bookingDetails.map((seat, i) => (
                            <li key={i} className="font-medium text-slate-800 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                {seat}
                            </li>
                        ))}
                    </ul>
                </div>

                <Link
                    href="/"
                    className="block w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    // Error State
    return (
        <div>
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Failed</h2>
            <p className="text-slate-600 mb-6">{message}</p>

            <Link
                href="/"
                className="block w-full bg-white border border-slate-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition"
            >
                Try Again
            </Link>
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                <Suspense fallback={<div>Loading...</div>}>
                    <CallbackContent />
                </Suspense>
            </div>
        </div>
    );
}
