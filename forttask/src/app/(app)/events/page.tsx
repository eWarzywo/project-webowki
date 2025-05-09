"use client";
import EventDatePicker from "@/components/eventList/eventDatePicker";
import EventAddForm from "@/components/eventList/eventAddForm";
import EventList from "@/components/eventList/eventList";
import { useState, useEffect } from "react";

export default function Events() {
    const [date, setDate] = useState<Date>(new Date());

    const handleDateChange = (newDate: Date) => {
        setDate(newDate);
    }

    useEffect(() => {
        // This effect runs when the date changes
        console.log("Selected date:", date);
    }, [date]);

    return (
        <>
            <div className="flex w-full self-stretch gap-[10px]">
                <EventDatePicker
                    onChange={handleDateChange}
                />
                <EventList />
                <EventAddForm />
            </div>
        </>
    );
}
