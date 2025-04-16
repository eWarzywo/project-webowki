import Pagination from '@/components/generalUI/pagination';
import Image from 'next/image';

export default function ShoppingListHandler() {
    function getData() {
        return [
            ['Vodka', 5, 'Emati'],
            ['Vodka', 5, ''],
            ['Vodka', , 'Emati'],
            ['Vodka', , 'Emati'],
            ['Vodka', , 'Emati'],
            ['Vodka', , 'Emati'],
        ];
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
                    <span key={index} className="w-full">
                        <div className="flex flex-col w-full gap-2.5 items-start py-4">
                            <div className="flex justify-between w-full py-2">
                                <div className="text-zinc-50 w-1/3 flex justify-start items-center">
                                    {item[0] + (item[1] ? ' - ' + item[1] + '$' : '')}
                                </div>
                                <div className="text-zinc-400 w-1/3 flex justify-center items-center">
                                    {item[2] ? 'Added by ' + item[2] : 'Creator not specified'}
                                </div>
                                <div className="w-1/3 flex justify-end items-center">
                                    <span className="flex gap-2.5">
                                        <div className="border-2 border-zinc-200 rounded-[5px] size-5 cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-out hover:bg-zinc-200" />
                                        <Image
                                            src="/shopping-list-vector.svg"
                                            alt="close"
                                            width={20}
                                            height={20}
                                            className="cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-ou"
                                            style={{
                                                filter: 'invert(16%) sepia(91%) saturate(7496%) hue-rotate(0deg) brightness(96%) contrast(104%)',
                                            }}
                                        />
                                    </span>
                                </div>
                            </div>
                        </div>
                        <hr className="border-zinc-700 border" />
                    </span>
                ))}
            </div>
            <Pagination data={data} itemsPerPage={1} />
        </div>
    );
}
