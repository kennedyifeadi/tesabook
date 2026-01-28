'use client';

import { useState } from 'react';
import { initiateBooking } from '@/actions/payment';
import { toast } from 'sonner';

interface BookingModalProps {
    selectedStations: string[];
    onClose: () => void;
}

const STATION_PRICE = 6500;

export default function BookingModal({ selectedStations, onClose }: BookingModalProps) {
    const [loading, setLoading] = useState(false);
    const totalAmount = selectedStations.length * STATION_PRICE;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        const result = await initiateBooking(formData, selectedStations);

        if (result.success && result.paymentUrl) {
            toast.success("Redirecting to payment...");
            window.location.href = result.paymentUrl;
        } else {
            toast.error(result.error || "Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Complete Booking</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <span className="sr-only">Close</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl mb-6">
                    <div className="flex justify-between text-sm mb-2 text-indigo-700">
                        <span>Selected Seats:</span>
                        <span className="font-bold">{selectedStations.length}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-indigo-900">
                        <span>Total Amount:</span>
                        <span>₦{totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input name="name" required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input name="email" required type="email" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input name="phone" required type="tel" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                        <input name="department" required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 mt-4 flex justify-center"
                    >
                        {loading ? 'Processing...' : `Pay ₦${totalAmount.toLocaleString()}`}
                    </button>
                </form>
            </div>
        </div>
    );
}
