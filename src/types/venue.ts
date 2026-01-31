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
        rentals?: {
            chairs: number;
            tables: number;
        };
        fees?: {
            base: number;
            logistics: number;
            rentalTotal: number;
        };
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
