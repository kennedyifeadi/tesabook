export interface Venue {
    id?: string;
    name: string;
    capacity: number;
    status?: 'Available' | 'Pending' | 'Booked';
}
