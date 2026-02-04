'use server';

import { migrateVenue } from '@/utils/migrateVenue';
import { migrateNFLT } from '@/utils/migrateNFLT';

export async function runMigration() {
    return await migrateVenue();
}

export async function runNFLTMigration() {
    return await migrateNFLT();
}
