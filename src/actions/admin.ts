'use server';

import { migrateVenue } from '@/utils/migrateVenue';

export async function runMigration() {
    return await migrateVenue();
}
