'use client';

import { useState } from 'react';
import { runMigration, runNFLTMigration } from '@/actions/admin';

export default function MigratePage() {
    const [status, setStatus] = useState<string>('');

    const handleMigrate = async () => {
        setStatus('Running migration (Civil -> Ftech)...');
        try {
            const result = await runMigration();
            if (result.success) {
                setStatus(`Success: ${result.message}`);
            } else {
                setStatus(`Error: ${JSON.stringify(result.error)}`);
            }
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
        }
    };

    const handleNFLTMigrate = async () => {
        setStatus('Running NFLT Capacity Swap...');
        try {
            const result = await runNFLTMigration();
            if (result.success) {
                setStatus(`Success: ${result.message}`);
            } else {
                setStatus(`Error: ${JSON.stringify(result.error)}`);
            }
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
        }
    };

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-4">Admin Migration</h1>

            <div className="mb-6">
                <h2 className="font-semibold mb-2">Venue Migration</h2>
                <p className="mb-2">Migrate 'Civil Front' / 'New Civil' to 'Ftech tarmac' (10 slots).</p>
                <button
                    onClick={handleMigrate}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Run Venue Migration
                </button>
            </div>

            <div className="mb-6">
                <h2 className="font-semibold mb-2">Capacity Correction</h2>
                <p className="mb-2">Set NFLT Front to 10, NFLT Back to 20.</p>
                <button
                    onClick={handleNFLTMigrate}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Fix NFLT Capacities
                </button>
            </div>

            <div className="mt-4 p-4 bg-gray-100 rounded">
                <pre>{status}</pre>
            </div>
        </div>
    );
}
