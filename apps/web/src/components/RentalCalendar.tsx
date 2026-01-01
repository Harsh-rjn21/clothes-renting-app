"use client";

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface RentalCalendarProps {
    bookedDates: Date[];
    price1Day: number;
    price3Days: number;
    price7Days: number;
    onBook: (startDate: Date, duration: number) => void;
}

const RentalCalendar = ({ bookedDates, price1Day, price3Days, price7Days, onBook }: RentalCalendarProps) => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [duration, setDuration] = useState<number>(3); // Default 3 days

    const handleBook = () => {
        if (selectedDate) {
            onBook(selectedDate, duration);
        }
    };

    const isDateDisabled = (date: Date) => {
        // Check if date is in the past
        if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
        
        // Check if date is booked
        return bookedDates.some(bookedDate => 
            bookedDate.getDate() === date.getDate() &&
            bookedDate.getMonth() === date.getMonth() &&
            bookedDate.getFullYear() === date.getFullYear()
        );
    };

    const getPrice = () => {
        switch (duration) {
            case 1: return price1Day;
            case 3: return price3Days;
            case 7: return price7Days;
            default: return 0;
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Rental Dates</h3>
            
            <div className="flex justify-center mb-6">
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={isDateDisabled}
                    modifiersClassNames={{
                        selected: 'bg-indigo-600 text-white rounded-full',
                        today: 'text-indigo-600 font-bold'
                    }}
                />
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <div className="mt-2 flex space-x-4">
                        {[1, 3, 7].map((d) => (
                            <button
                                key={d}
                                onClick={() => setDuration(d)}
                                className={`px-4 py-2 text-sm font-medium rounded-md ${
                                    duration === d
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {d} Day{d > 1 ? 's' : ''}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-base font-medium text-gray-900">Total Price</span>
                        <span className="text-2xl font-bold text-indigo-600">${getPrice()}</span>
                    </div>

                    <button
                        onClick={handleBook}
                        disabled={!selectedDate}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                            selectedDate
                                ? 'bg-indigo-600 hover:bg-indigo-700'
                                : 'bg-gray-300 cursor-not-allowed'
                        }`}
                    >
                        {selectedDate ? 'Book Now' : 'Select a Start Date'}
                    </button>
                    {selectedDate && (
                        <p className="mt-2 text-xs text-gray-500 text-center">
                            Rental Period: {format(selectedDate, 'MMM d')} - {format(addDays(selectedDate, duration), 'MMM d, yyyy')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RentalCalendar;
