export interface Station {
    id: string;
    status: 'available' | 'pending' | 'booked';
    lockedAt?: number;
    lockedBy?: string; // userId or email
    paymentReference?: string;
}

export interface Venue {
    id?: string;
    slug?: string;
    name: string;
    capacity: number;
    stations?: Station[];
}
