import Pagination from '@/components/generalUI/pagination';

export default function ShoppingListHandler() {
    function getData() {
        // Fetch data from the server or local storage
        return ['meow', 'meow', 'meow'];
    }

    const data = getData();

    return (
        <div className="w-5/6 flex flex-[1_0_0] flex-col items-start rounded-xl border bg-zinc-950 border-zinc-800 text-zinc-50">
            <Pagination data={data} itemsPerPage={1} />
        </div>
    );
}
