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
    const [chairCount, setChairCount] = useState(0);
    const [tableCount, setTableCount] = useState(0);

    const seatTotal = selectedStations.length * STATION_PRICE;
    const extrasTotal = (chairCount * 2500) + (tableCount * 2500);
    const logisticsFee = (chairCount > 0 || tableCount > 0) ? 2000 : 0;
    const totalAmount = seatTotal + extrasTotal + logisticsFee + 2500;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        // Explicitly append if needed, but input[type=hidden] is easier for standard FormData

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
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Complete Booking</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <span className="sr-only">Close</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl mb-6 space-y-2">
                    <div className="flex justify-between text-sm text-indigo-700">
                        <span>Selected Tents ({selectedStations.length}):</span>
                        <span className="font-semibold">₦{seatTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-indigo-700">
                        <span>Booking Fee:</span>
                        <span className="font-semibold">₦2,500</span>
                    </div>
                    {(chairCount > 0 || tableCount > 0) && (
                        <>
                            <div className="flex justify-between text-sm text-indigo-700">
                                <span>Equipment:</span>
                                <span className="font-semibold">₦{extrasTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-indigo-700">
                                <span>Logistics Fee:</span>
                                <span className="font-semibold">₦{logisticsFee.toLocaleString()}</span>
                            </div>
                        </>
                    )}
                    <div className="border-t border-indigo-200 my-2 pt-2 flex justify-between text-base font-bold text-indigo-900">
                        <span>Total to Pay:</span>
                        <span>₦{totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="chairs" value={chairCount} />
                    <input type="hidden" name="tables" value={tableCount} />

                    {/* Equipment Rental Section */}
                    <div className="border-b border-slate-100 pb-4 mb-4">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Add Extras (Optional)</h3>

                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <p className="text-sm font-medium text-slate-700">Chairs (Per Dozen)</p>
                                <p className="text-xs text-slate-500">₦2,500 / dozen</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button type="button" onClick={() => setChairCount(Math.max(0, chairCount - 1))} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition">-</button>
                                <span className="text-sm font-semibold w-6 text-center">{chairCount}</span>
                                <button type="button" onClick={() => setChairCount(chairCount + 1)} className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition">+</button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-slate-700">Tables (Per Unit)</p>
                                <p className="text-xs text-slate-500">₦2,500 / unit</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button type="button" onClick={() => setTableCount(Math.max(0, tableCount - 1))} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition">-</button>
                                <span className="text-sm font-semibold w-6 text-center">{tableCount}</span>
                                <button type="button" onClick={() => setTableCount(tableCount + 1)} className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition">+</button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Matric Number</label>
                        <input name="matricNumber" required type="text" placeholder="e.g. 1904080..." className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
                    </div>
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
