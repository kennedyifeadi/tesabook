'use client';

import { useRouter } from 'next/navigation';
import { RefreshCcw } from 'lucide-react';
import { useState } from 'react';

export default function RefreshButton() {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.refresh();
        // Reset state after a short delay to give feedback, 
        // though strictly the refresh is async and we don't know exactly when it finishes without transitions.
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
    );
}
