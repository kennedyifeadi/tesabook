import { Station, Venue } from '@/types/venue';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { IS_BOOKING_CLOSED } from '@/utils/constants';

interface StationGridProps {
    venue: Venue;
    selectedStations: string[]; // List of station IDs globally selected
    onToggleSelect: (stationId: string) => void;
    onClose: () => void;
}

export default function StationGrid({ venue, selectedStations, onToggleSelect, onClose }: StationGridProps) {
    const handleStationClick = (station: Station) => {
        if (IS_BOOKING_CLOSED) {
            toast.error("Booking time has expired!");
            return;
        }
        if (station.status !== 'available') return;

        // Check limit if selecting a new station
        if (!selectedStations.includes(station.id) && selectedStations.length >= 3) {
            toast.error("Maximum 3 stations allowed!");
            return;
        }

        onToggleSelect(station.id);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{venue.name}</h2>
                        <p className="text-sm text-slate-500">Select up to 3 tents</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
                        {venue.stations?.map((station) => {
                            const isSelected = selectedStations.includes(station.id);
                            const isAvailable = station.status === 'available';

                            return (
                                <button
                                    key={station.id}
                                    onClick={() => handleStationClick(station)}
                                    disabled={!isAvailable || IS_BOOKING_CLOSED}
                                    className={twMerge(
                                        "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 border-2",
                                        // Status colors
                                        station.status === 'available' && "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:scale-105",
                                        station.status === 'pending' && "bg-amber-50 border-amber-200 text-amber-700 opacity-80 cursor-not-allowed",
                                        station.status === 'booked' && "bg-rose-50 border-rose-200 text-rose-700 opacity-60 cursor-not-allowed",
                                        // Selection state
                                        isSelected && "bg-emerald-600 text-white border-emerald-600 shadow-md scale-105 ring-2 ring-emerald-200 ring-offset-2"
                                    )}
                                >
                                    {station.id}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <div className="flex items-center gap-4 text-xs font-medium mr-auto">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded full bg-emerald-50 border border-emerald-200"></div> Available
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded full bg-amber-50 border border-amber-200"></div> Pending
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded full bg-rose-50 border border-rose-200"></div> Booked
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
