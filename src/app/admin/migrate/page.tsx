'use client';

import { useState } from 'react';
import { runMigration } from '@/actions/admin';

export default function MigratePage() {
    const [status, setStatus] = useState<string>('');

    const handleMigrate = async () => {
        setStatus('Running migration...');
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

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-4">Admin Migration</h1>
            <p className="mb-4">Migrate 'Civil Front' to 'Ftech tarmac' (10 slots).</p>
            <button
                onClick={handleMigrate}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Run Migration
            </button>
            <div className="mt-4 p-4 bg-gray-100 rounded">
                <pre>{status}</pre>
            </div>
        </div>
    );
}
