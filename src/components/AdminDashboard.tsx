'use client';

import { useState } from 'react';
import { Venue, Station } from '@/types/venue';
import { 
    Tent, 
    Armchair, 
    LayoutGrid, 
    ChevronDown, 
    ChevronUp, 
    User, 
    Mail, 
    Phone, 
    Hash, 
    CreditCard, 
    Calendar,
    X,
    Download
} from 'lucide-react';

interface Stats {
    totalTents: number;
    totalChairs: number;
    totalTables: number;
}

interface AdminDashboardProps {
    stats: Stats;
    venues: Venue[];
}

export default function AdminDashboard({ stats, venues }: AdminDashboardProps) {
    const [expandedVenueId, setExpandedVenueId] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<{ station: Station; venueName: string } | null>(null);

    const toggleVenue = (id: string) => {
        setExpandedVenueId(expandedVenueId === id ? null : id);
    };

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString('en-NG', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const formatCurrency = (amount?: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount || 0);
    };

    const handleExportCSV = () => {
        // Flatten the data
        const rows = [];
        const headers = [
            "Venue Name",
            "Tent ID",
            "Preferred Tent Name",
            "Student Name",
            "Matric Number",
            "Phone",
            "Email",
            "Chairs",
            "Tables",
            "Total Paid",
            "Ercas Ref",
            "Date Booked"
        ];

        rows.push(headers.join(","));

        venues.forEach(venue => {
            if (!venue.stations) return;
            venue.stations.forEach(station => {
                if (station.status === 'booked' && station.bookedBy) {
                    const bookedBy = station.bookedBy;
                    const rentals = bookedBy.rentals || { chairs: 0, tables: 0 };
                    const fees = bookedBy.fees || { base: 0, logistics: 0, rentalTotal: 0 };
                    const totalPaid = (fees.base || 0) + (fees.logistics || 0) + (fees.rentalTotal || 0);
                    
                    const dateBooked = station.lockedAt 
                        ? new Date(station.lockedAt).toLocaleString('en-NG') 
                        : "N/A";

                    const row = [
                        `"${venue.name}"`,
                        `"${station.id}"`,
                        `"${bookedBy.tentName || ''}"`,
                        `"${bookedBy.name || ''}"`,
                        `"${bookedBy.matricNumber || ''}"`,
                        `"${bookedBy.phone || ''}"`,
                        `"${bookedBy.email || ''}"`,
                        rentals.chairs || 0,
                        rentals.tables || 0,
                        totalPaid,
                        `"${station.paymentReference || ''}"`,
                        `"${dateBooked}"`
                    ];

                    rows.push(row.join(","));
                }
            });
        });

        const csvContent = rows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "tesa_convocation_bookings.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            {/* Export Button Row */}
            <div className="flex justify-end">
                 <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Export to CSV
                </button>
            </div>

            {/* Top Section: Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Tent className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Tents Booked</p>
                        <h3 className="text-3xl font-bold text-slate-900">{stats.totalTents}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Armchair className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Extra Chairs</p>
                        <h3 className="text-3xl font-bold text-slate-900">{stats.totalChairs}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <LayoutGrid className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Extra Tables</p>
                        <h3 className="text-3xl font-bold text-slate-900">{stats.totalTables}</h3>
                    </div>
                </div>
            </div>

            {/* Middle Section: Venues List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Venue Bookings</h2>
                {venues.map((venue) => {
                    const venueId = venue.id || venue.name;
                    return (
                        <div key={venueId} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <button
                                onClick={() => toggleVenue(venueId)}
                                className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition"
                            >
                                <span className="font-semibold text-lg text-slate-800">{venue.name}</span>
                                {expandedVenueId === venueId ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </button>

                            {expandedVenueId === venueId && (
                                <div className="border-t border-slate-100">
                                    {venue.stations && venue.stations.length > 0 ? (
                                        <div className="divide-y divide-slate-50">
                                            {venue.stations.map((station) => {
                                                const isBooked = station.status === 'booked';
                                                return (
                                                    <div
                                                        key={station.id}
                                                        onClick={() => isBooked && setSelectedBooking({ station, venueName: venue.name })}
                                                        className={`px-6 py-3 flex justify-between items-center transition ${
                                                            isBooked 
                                                                ? 'cursor-pointer hover:bg-indigo-50/50' 
                                                                : 'opacity-50 bg-slate-50 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-2 h-2 rounded-full ${isBooked ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                                            <span className={`font-medium ${isBooked ? 'text-slate-900' : 'text-slate-500'}`}>
                                                                Tent {station.id}
                                                            </span>
                                                        </div>
                                                        <span className={`text-sm ${isBooked ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                                                            {isBooked && station.bookedBy ? station.bookedBy.name : 'Available'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-slate-400">No stations found for this venue.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Section: Booking Details Modal */}
            {selectedBooking && selectedBooking.station.bookedBy && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center shrink-0">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <Tent className="w-5 h-5" />
                                Booking Details
                            </h3>
                            <button 
                                onClick={() => setSelectedBooking(null)}
                                className="text-indigo-100 hover:text-white transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* Grid Layout for Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                {/* Column 1: Student & Tent Info */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider border-b border-indigo-100 pb-2">Student Information</h4>
                                        
                                        <div className="space-y-3">
                                            <div className="flex items-start space-x-3">
                                                <User className="w-5 h-5 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-slate-500">Full Name</p>
                                                    <p className="font-medium text-slate-900">{selectedBooking.station.bookedBy.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <Hash className="w-5 h-5 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-slate-500">Matric Number</p>
                                                    <p className="font-medium text-slate-900">{selectedBooking.station.bookedBy.matricNumber}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-slate-500">Email</p>
                                                    <p className="font-medium text-slate-900 truncate max-w-[200px]">{selectedBooking.station.bookedBy.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-slate-500">Phone</p>
                                                    <p className="font-medium text-slate-900">{selectedBooking.station.bookedBy.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider border-b border-indigo-100 pb-2">Tent Information</h4>
                                        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 text-sm">Venue</span>
                                                <span className="font-medium text-slate-900">{selectedBooking.venueName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 text-sm">Tent ID</span>
                                                <span className="font-medium text-slate-900">#{selectedBooking.station.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 text-sm">Tent Name</span>
                                                <span className="font-medium text-slate-900">{selectedBooking.station.bookedBy.tentName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Financials & Rentals */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider border-b border-indigo-100 pb-2">Rentals</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-indigo-50 p-4 rounded-lg text-center">
                                                <Armchair className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                                                <p className="text-2xl font-bold text-indigo-900">{selectedBooking.station.bookedBy.rentals?.chairs || 0}</p>
                                                <p className="text-xs text-indigo-600 font-medium">Extra Chairs</p>
                                            </div>
                                            <div className="bg-indigo-50 p-4 rounded-lg text-center">
                                                <LayoutGrid className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                                                <p className="text-2xl font-bold text-indigo-900">{selectedBooking.station.bookedBy.rentals?.tables || 0}</p>
                                                <p className="text-xs text-indigo-600 font-medium">Extra Tables</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider border-b border-indigo-100 pb-2">Values & Payment</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Base Tent Fee</span>
                                                <span className="font-medium">{formatCurrency(selectedBooking.station.bookedBy.fees?.base)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Logistics Fee</span>
                                                <span className="font-medium">{formatCurrency(selectedBooking.station.bookedBy.fees?.logistics)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Rental Total</span>
                                                <span className="font-medium">{formatCurrency(selectedBooking.station.bookedBy.fees?.rentalTotal)}</span>
                                            </div>
                                            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                                                <span className="font-bold text-slate-900">Total Paid</span>
                                                <span className="font-bold text-xl text-green-600">
                                                    {formatCurrency(
                                                        (selectedBooking.station.bookedBy.fees?.base || 0) +
                                                        (selectedBooking.station.bookedBy.fees?.logistics || 0) +
                                                        (selectedBooking.station.bookedBy.fees?.rentalTotal || 0)
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                                            <CreditCard className="w-3 h-3" />
                                            <span className="font-mono">{selectedBooking.station.paymentReference || 'No Ref'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                                            <Calendar className="w-3 h-3" />
                                            <span>Booked {formatDate(selectedBooking.station.lockedAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50 px-6 py-4 flex justify-end shrink-0">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
