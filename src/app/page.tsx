'use client';

import { useState } from "react";
import Navbar from "@/components/Navbar";
import SectionCard from "@/components/SectionCard";
import StationGrid from "@/components/StationGrid";
import { useRealTimeSections } from "@/hooks/useRealTimeSections";
import { Toaster, toast } from "sonner";
import BookingModal from "@/components/BookingModal";
import { Venue } from "@/types/venue";

export default function Home() {
  const { sections, loading, error } = useRealTimeSections();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleToggleSelect = (stationId: string, venueSlug: string) => {
    const fullId = `${venueSlug}::${stationId}`;
    if (selectedStations.includes(fullId)) {
      setSelectedStations(prev => prev.filter(id => id !== fullId));
    } else {
      // Limit check
      if (selectedStations.length >= 3) {
        toast.error("Maximum 3 stations allowed!");
        return;
      }
      setSelectedStations(prev => [...prev, fullId]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Toaster position="top-center" richColors />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Select a Section</h2>
          <p className="text-slate-500 mt-2">Choose a venue to view available seats.</p>
        </header>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl mb-8">
            Error loading venues: {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map(venue => (
              <SectionCard
                key={venue.id}
                venue={venue}
                onClick={() => setSelectedVenue(venue)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedVenue && (
        <StationGrid
          venue={selectedVenue}
          selectedStations={selectedStations
            .filter(id => id.startsWith(`${selectedVenue.id}::`))
            .map(id => id.split('::')[1])
          }
          onToggleSelect={(stationId) => handleToggleSelect(stationId, selectedVenue.id!)}
          onClose={() => setSelectedVenue(null)}
        />
      )}

      {/* Floating Action */}
      {selectedStations.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-900 text-white px-6 py-3 rounded-full hover:scale-105 transition shadow-lg flex items-center gap-4 z-40">
          <span className="font-medium">{selectedStations.length} Selected (₦{(selectedStations.length * 6500).toLocaleString()})</span>
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-full text-xs font-bold transition"
          >
            Proceed to Book
          </button>
        </div>
      )}

      {isBookingModalOpen && (
        <BookingModal
          selectedStations={selectedStations}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}
    </div>
  );
}
