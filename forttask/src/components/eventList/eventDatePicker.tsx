import Calendar from '@/components/generalUI/calendar';
import Image from 'next/image';

export default function EventDatePicker() {
    return (
        <div className="flex w-auto h-auto flex-col items-center max-h-96">
            <div className="flex w-full justify-center items-center rounded-xl border border-zinc-800 bg-zinc-950 max-h-96 mb-2 p-2">
                <Image src="/Calendar.svg" alt="Calendar" width={32} height={20} />
                <p className="text-4m text-zinc-400 w-full justify-between items-center pl-1">Pick a date</p>
            </div>
            <Calendar />
        </div>
    )
}