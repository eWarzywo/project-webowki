'use client';
import Pagination from '@/components/generalUI/pagination';
import ShoppingListItem from '@/components/shoppingList/shoppingListItem';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';

interface ShoppingItem {
    id: number;
    name: string;
    cost: number;
    createdBy: {
        username: string;
    };
    boughtBy: {
        id: number;
        username: string;
    } | null;
    updatedAt: string | null;
}

export default function ShoppingListHandler() {
    const [data, setData] = useState<ShoppingItem[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [refresh, setRefresh] = useState(false);

    const itemsPerPage = 6;
    const searchParams = useSearchParams();
    const page = parseInt(searchParams?.get('page') || '1', 10);

    noStore();

    useEffect(() => {
        const fetchTotalItems = async () => {
            try {
                const response = await fetch('/api/shoppingList/totalNumber');
                if (response.ok) {
                    const { count } = await response.json();
                    setTotalItems(count);
                } else {
                    console.error(`Failed to fetch total items, Status: ${response.status}`);
                }
            } catch (error) {
                console.error('Error fetching total items:', error);
            }
        };

        fetchTotalItems();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `/api/shoppingList?limit=${itemsPerPage}&skip=${(page - 1) * itemsPerPage}`,
                );
                if (response.ok) {
                    const items = await response.json();
                    setData(items);
                } else {
                    console.error(`Failed to fetch shopping list data, Status: ${response.status}`);
                }
            } catch (error) {
                console.error('Error fetching shopping list data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [page, refresh]);

    const handleDelete = (id: number) => {
        fetch(`/api/shoppingList?id=${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        })
            .then((response) => {
                if (!response.ok) throw new Error('Failed to delete item');
                setRefresh((prev) => !prev);
                return response.json();
            })
            .catch((error) => console.error('Error deleting item:', error));
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center w-full py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-zinc-400"></div>
                </div>
            );
        }

        if (data.length === 0) {
            return (
                <div className="flex items-center justify-center w-full py-10 text-zinc-400">
                    <p className="text-lg">No items found in your shopping list. {':('}</p>
                </div>
            );
        }

        return data.map((item) => (
            <span key={item.id} className="w-full">
                <ShoppingListItem id={item.id} handleDelete={() => handleDelete(item.id)} />
                <hr className="border-zinc-700 border" />
            </span>
        ));
    };

    return (
        <div className="w-5/6 flex flex-[1_0_0] flex-col items-start rounded-xl border bg-zinc-950 border-zinc-800 text-zinc-50 pb-5">
            <div className="flex p-6 flex-col justify-center items-start">
                <h2 className="text-2xl font-semibold text-zinc-50 self-stretch gap-2.5 flex items-center">
                    Your shopping List
                </h2>
                <p className="gap-2.5 mt-1.5 flex self-stretch text-sm font-normal text-zinc-400">Manage your needs</p>
            </div>
            <div className="flex items-start flex-col self-stretch px-[30px]">{renderContent()}</div>
            {Math.ceil(totalItems / itemsPerPage) > 1 && (
                <span className="flex justify-center items-center w-full mt-5">
                    <Pagination totalNumberOfItems={totalItems} itemsPerPage={itemsPerPage} />
                </span>
            )}
        </div>
    );
}
