import EventDatePicker from "@/components/eventList/eventDatePicker";
import EventAddForm from "@/components/eventList/eventAddForm";

export default function Events() {
    return (
        <>
            <div className="flex w-full self-stretch gap-[10px]">
                <EventDatePicker />
                <EventAddForm />
            </div>
        </>
    );
}
