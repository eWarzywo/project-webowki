import Pagination from '@/components/generalUI/pagination';

export default function ShoppingListHandler() {
    function getData() {
        return [['Vodka', 5, 'Emati'], ['Vodka', 5, ''], , ['Vodka', , 'Emati']];
    }

    const data = getData().filter((item): item is [string, number, string] => item !== undefined);

    return (
        <div className="w-5/6 flex flex-[1_0_0] flex-col items-start rounded-xl border bg-zinc-950 border-zinc-800 text-zinc-50">
            <div className="flex p-6 flex-col justify-center items-start">
                <h2 className="text-2xl font-semibold text-zinc-50 self-stretch gap-2.5 flex items-center">
                    Your shopping List
                </h2>
                <p className="gap-2.5 mt-1.5 flex self-stretch text-sm font-normal text-zinc-400">Manage your needs</p>
            </div>
            <div className=" flex items-start flex-col self-stretch px-[30px]">
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col w-full gap-2.5 items-start">
                        <div className="flex justify-between w-full py-2">
                            <span className="text-zinc-50">{item[0] + (item[1] ? ' - ' + item[1] + '$' : '')}</span>
                            <span className="text-zinc-400">
                                {item[2] ? 'Added by ' + item[2] : 'Creator not specified'}
                            </span>
                            <span></span>
                        </div>
                    </div>
                ))}
            </div>
            <Pagination data={data} itemsPerPage={1} />
        </div>
    );
}
