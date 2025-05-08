import EventCard from "@/components/eventList/eventCard";

export default function EventList() {
    return (
        <div className="w-full">
            <div className="flex w-full justify-center items-center rounded-xl border border-zinc-800 bg-zinc-950 max-h-96 mb-2 p-2">
                <p className="text-4m text-zinc-400 w-full text-center pl-1">Event List</p>
            </div>
            <div className="flex w-full h-fit flex-col gap-2 border border-zinc-800 bg-zinc-950 rounded-xl p-4">
                <EventCard />
            </div>
        </div>
    );
}