import { Suspense } from 'react';
import { getBookingStats } from '@/app/actions/stats';
import AdminDashboard from '@/components/AdminDashboard';
import RefreshButton from '@/components/RefreshButton';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StatsPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const key = sp?.key;

    if (key !== 'my-secret-key') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-800">
                <div className="text-xl font-bold bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    Access Denied
                </div>
            </div>
        );
    }

    const { stats, venues } = await getBookingStats();

    return (
        <div className="min-h-screen bg-gray-50 p-8 pt-10">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                        <p className="text-slate-500 mt-1">Live overview of TESA specific bookings</p>
                    </div>
                    <div>
                        <RefreshButton />
                    </div>
                </div>

                <Suspense fallback={<div className="text-center py-20 text-slate-500">Loading stats...</div>}>
                    <AdminDashboard stats={stats} venues={venues} />
                </Suspense>

                <div className="mt-12 text-center text-sm text-gray-400 pb-10">
                    <p>Metrics fetched directly from live database.</p>
                </div>
            </div>
        </div>
    );
}
