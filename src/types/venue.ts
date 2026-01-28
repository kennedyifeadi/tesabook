export interface Station {
    id: string;
    status: 'available' | 'locked' | 'pending' | 'booked';
    lockedAt?: number;
    lockedBy?: string; // userId or email
    bookedBy?: {
        email: string;
        name: string;
        phone: string;
        matricNumber: string;
    };
    paymentReference?: string;
}

export interface Venue {
    id?: string;
    slug?: string;
    name: string;
    capacity: number;
    stations?: Station[];
}
