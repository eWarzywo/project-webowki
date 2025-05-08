import Calendar from '@/components/generalUI/calendar';

export default function EventAddForm() {
    return (
        <div className="flex w-auto flex-col items-center">
            <div className="flex w-full justify-center items-center rounded-xl border border-zinc-800 bg-zinc-950 mb-2 p-2">
                <p className="text-4m text-zinc-400 w-full text-end pl-1">Add Event</p>
            </div>
            <form className="flex flex-col w-full justify-center items-end rounded-xl border border-zinc-800 bg-zinc-950 mb-2 p-2">
                <label htmlFor="eventName">Name</label>
                <input
                    type="text"
                    id="eventName"
                    placeholder="Name of the event"
                    className="py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none"
                />
                <label htmlFor="eventDate">Date</label>
                <Calendar />
                <label htmlFor="participants" className="mt-2">Participants</label>
                <p className="text-zinc-400 text-sm mb-1">Hold control for multiple choice</p>
                <select id="participants" multiple className="py-2 pl-3 pr-5 mb-2 w-full border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    placeholder="Description of the event"
                    className="py-2 pl-3 pr-5 mb-4 w-full border bg-zinc-950 border-zinc-800 placeholder:text-zinc-400 rounded-xl focus:border-zinc-400 focus:outline-none"
                />
                <div className="w-full flex justify-between px-6 pb-2 items-center">
                    <input
                        type="reset"
                        value="Cancel"
                        className="border rounded-xl gap-2.5 px-4 py-2 border-zinc-800 flex max-h-10 min-h-10 flex-col justify-center items-center hover:bg-zinc-800 hover:border-zinc-400 text-zinc-50 font-medium text-sm cursor-pointer"
                    />
                    <input
                        type="submit"
                        value="Add"
                        className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded-xl gap-2.5 hover:bg-zinc-600 hover:text-zinc-200 hover:border hover:border-zinc-200 cursor-pointer text-sm font-medium"
                    />
                </div>
            </form>
        </div>
    );
}