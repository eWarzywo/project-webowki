export default function EventCard() {
    console.log("render");
    return (
        <div className="flex w-full h-fit gap-2 border border-zinc-800 bg-zinc-950 rounded-xl p-4">
            <div className="flex flex-col w-4/5">
                <h2 className="text-2xl font-semibold">Event name</h2>
                <div className="flex">
                    <p className="mr-2">User 1</p>
                    <p className="mr-2">User 2</p>
                    <p className="mr-2">User 3</p>
                </div>
                <p>Description</p>
                <div className="flex">
                    <p className="mr-2">Date</p>
                    <p>Time</p>
                </div>
            </div>
            <div className="flex flex-col w-1/5 justify-center">
                <input type="button" value="Done" className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded-xl gap-2.5 hover:bg-zinc-600 hover:text-zinc-200 hover:border hover:border-zinc-200 cursor-pointer text-sm font-medium" />
            </div>
        </div>
    );
}