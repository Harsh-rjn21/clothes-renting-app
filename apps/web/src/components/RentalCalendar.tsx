"use client";

import { useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, differenceInDays, isSameDay } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface RentalCalendarProps {
    bookedDates: Date[];
    price1Day: number;
    priceSubsequentDay: number;
    onBook: (range: DateRange) => void;
    onWhatsApp: (range: DateRange, totalPrice: number) => void;
    isLoggedIn: boolean;
}

const RentalCalendar = ({ bookedDates, price1Day, priceSubsequentDay, onBook, onWhatsApp, isLoggedIn }: RentalCalendarProps) => {
    const [range, setRange] = useState<DateRange | undefined>(undefined);

    const isDateDisabled = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) return true;
        
        return bookedDates.some(bookedDate => isSameDay(new Date(bookedDate), date));
    };

    const calculatePrice = () => {
        if (!range?.from || !range?.to) return 0;
        const days = differenceInDays(range.to, range.from) + 1;
        if (days <= 0) return 0;
        return price1Day + (days - 1) * priceSubsequentDay;
    };

    const totalPrice = calculatePrice();

    return (
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="p-2 sm:p-4 flex justify-center">
                <style>{`
                    .rdp { --rdp-accent-color: #4f46e5; --rdp-background-color: #f5f3ff; margin: 0; }
                    .rdp-day_selected { background-color: var(--rdp-accent-color) !important; color: white !important; font-weight: 800; }
                    .rdp-day_selected:hover { background-color: #4338ca !important; }
                    .rdp-day_today { color: #4f46e5; font-weight: 800; border-bottom: 2px solid #4f46e5; border-radius: 0; }
                    .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f8fafc; color: #4f46e5; }
                `}</style>
                <DayPicker
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    disabled={isDateDisabled}
                    className="font-sans border-0"
                />
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">Estimate</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Rs. {totalPrice}</p>
                    </div>
                </div>

                {!isLoggedIn ? (
                    <Link href="/login" className="w-full block text-center py-4 px-6 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-100">
                        Sign in to Book
                    </Link>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={() => range && onBook(range)}
                            disabled={!range?.from || !range?.to}
                            className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition-all shadow-xl ${
                                range?.from && range?.to
                                    ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            }`}
                        >
                            {range?.from && range?.to ? 'Secure Booking' : 'Select Dates First'}
                        </button>

                        <button
                            onClick={() => range && onWhatsApp(range, totalPrice)}
                            disabled={!range?.from || !range?.to}
                            className="w-full flex items-center justify-center space-x-2 py-4 px-6 bg-white border-2 border-green-500 rounded-2xl font-black text-sm text-green-600 hover:bg-green-50 transition-all disabled:opacity-40 disabled:border-slate-200 disabled:text-slate-300"
                        >
                            <span>Enquire via WhatsApp</span>
                        </button>
                    </div>
                )}

                {range?.from && range?.to && (
                    <div className="mt-4 flex items-center justify-center space-x-2 opacity-60">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                            {format(range.from, 'MMM d')} — {format(range.to, 'MMM d, yyyy')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Re-import Link in case it's used
import Link from 'next/link';

export default RentalCalendar;
