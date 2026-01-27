import { Venue } from '@/types/venue';

interface SectionCardProps {
    venue: Venue;
    onClick: () => void;
}

export default function SectionCard({ venue, onClick }: SectionCardProps) {
    const availableCount = venue.stations?.filter(s => s.status === 'available').length || 0;

    return (
        <div
            onClick={onClick}
            className="group relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden"
        >
            <div className="relative h-40 bg-slate-100 mb-4 rounded-lg overflow-hidden">
                <img
                    src={`/images/venues/${venue.id}.jpeg`}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>

            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {venue.name}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${availableCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                    {availableCount} / {venue.capacity} Left
                </span>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${((venue.capacity - availableCount) / venue.capacity) * 100}%` }}
                />
            </div>
            <p className="text-xs text-slate-500 mt-2 text-right">
                {venue.capacity} Total Seats
            </p>
        </div>
    );
}
