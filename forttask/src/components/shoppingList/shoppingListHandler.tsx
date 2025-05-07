'use client';
import Pagination from '@/components/generalUI/pagination';
import Image from 'next/image';
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';

interface ShoppingItem {
    name: string;
    cost: number;
    createdBy: {
        username: string;
    };
}

export default function ShoppingListHandler() {
    const [data, setData] = React.useState<ShoppingItem[]>([]);
    const itemsPerPage = 1;
    const searchParams = useSearchParams();
    const page = parseInt(searchParams?.get('page') || '1', 10);
    noStore();

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/shoppingList`);
                if (!response.ok) {
                    console.error(`Failed to fetch shopping list data, Status: ${response.status}`);
                    return;
                }

                const items = await response.json();
                setData(items);
                console.log('Shopping list data:', items);
            } catch (error) {
                console.error('Error fetching shopping list data:', error);
            }
        };

        fetchData();
    }, [page]);

    return (
        <div className="w-5/6 flex flex-[1_0_0] flex-col items-start rounded-xl border bg-zinc-950 border-zinc-800 text-zinc-50">
            <div className="flex p-6 flex-col justify-center items-start">
                <h2 className="text-2xl font-semibold text-zinc-50 self-stretch gap-2.5 flex items-center">
                    Your shopping List
                </h2>
                <p className="gap-2.5 mt-1.5 flex self-stretch text-sm font-normal text-zinc-400">Manage your needs</p>
            </div>
            <div className="flex items-start flex-col self-stretch px-[30px]">
                {data.map((item, index) => (
                    <span key={index} className="w-full">
                        <ShoppingListItem name={item.name} cost={item.cost} userName={item.createdBy.username} />
                        <hr className="border-zinc-700 border" />
                    </span>
                ))}
            </div>
            <Pagination data={data} itemsPerPage={itemsPerPage} />
        </div>
    );
}

function ShoppingListItem({ name, cost, userName }: { name: string; cost: number; userName: string }) {
    return (
        <div className="flex flex-col w-full gap-2.5 items-start py-4">
            <div className="flex justify-between w-full py-2">
                <div className="text-zinc-50 w-1/3 flex justify-start items-center">
                    {name + (cost ? ` - ${cost}$` : '')}
                </div>
                <div className="text-zinc-400 w-1/3 flex justify-center items-center">{`Added by ${userName}`}</div>
                <div className="w-1/3 flex justify-end items-center">
                    <span className="flex gap-2.5">
                        <div className="hover:bg-zinc-100 border-2 border-zinc-200 rounded-[5px] size-5 cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-out" />
                        <Image
                            src="/shopping-list-vector.svg"
                            alt="close"
                            width={20}
                            height={20}
                            className="cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-out"
                            style={{
                                filter: 'invert(16%) sepia(91%) saturate(7496%) hue-rotate(0deg) brightness(96%) contrast(104%)',
                            }}
                        />
                    </span>
                </div>
            </div>
        </div>
    );
}
