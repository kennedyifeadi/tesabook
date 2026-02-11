'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { getBookingStats } from '@/app/actions/stats';
import { useSearchParams } from 'next/navigation';

function StatsContent() {
    const searchParams = useSearchParams();
    const key = searchParams.get('key');

    const [stats, setStats] = useState<{ totalTents: number; totalChairs: number; totalTables: number } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await getBookingStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (key === 'my-secret-key') {
            fetchStats();
        }
    }, [key]);

    if (key !== 'my-secret-key') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-800">
                <div className="text-xl font-bold bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    Access Denied
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 pt-30">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Live Booking Stats</h1>
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tents Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center h-48">
                        <h2 className="text-lg font-medium text-gray-500 mb-2">Total Tents Booked</h2>
                        <div className="text-5xl font-bold text-blue-600">
                            {loading ? '...' : stats?.totalTents ?? 0}
                        </div>
                    </div>

                    {/* Chairs Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center h-48">
                        <h2 className="text-lg font-medium text-gray-500 mb-2">Chairs Rented (Dozen)</h2>
                        <div className="text-5xl font-bold text-emerald-600">
                            {loading ? '...' : stats?.totalChairs ?? 0}
                        </div>
                        <span className="text-sm text-gray-400 mt-2">Dozen</span>
                    </div>

                    {/* Tables Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center h-48">
                        <h2 className="text-lg font-medium text-gray-500 mb-2">Tables Rented</h2>
                        <div className="text-5xl font-bold text-purple-600">
                            {loading ? '...' : stats?.totalTables ?? 0}
                        </div>
                        <span className="text-sm text-gray-400 mt-2">Units</span>
                    </div>
                </div>

                <div className="mt-12 text-center text-sm text-gray-400">
                    <p>Data is fetched directly from Firestore.</p>
                </div>
            </div>
        </div>
    );
}

export default function StatsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <StatsContent />
        </Suspense>
    );
}
