'use client';
import { useState } from 'react';
import { seedDatabase } from '@/utils/seeder';

export default function SeederButton() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');

    const handleSeed = async () => {
        setLoading(true);
        setStatus('Seeding...');
        try {
            const results = await seedDatabase();
            const errorCount = results.filter(r => r.status === 'error').length;

            if (errorCount > 0) {
                const firstError = results.find(r => r.status === 'error')?.error;
                setStatus(`Failed: ${firstError?.toString() || 'Unknown error'}`);
            } else {
                setStatus('Seeding complete! Check Firestore.');
            }
        } catch (error: any) {
            setStatus(`System Error: ${error.message}`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <button
                onClick={handleSeed}
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 hover:bg-indigo-700 transition shadow-sm"
            >
                {loading ? 'Seeding Logic Running...' : 'Seed Database'}
            </button>
            {status && <p className={`mt-2 text-sm ${status.includes('error') ? 'text-rose-500' : 'text-emerald-600'}`}>{status}</p>}
        </div>
    );
}
