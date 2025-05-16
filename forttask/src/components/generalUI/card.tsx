import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export enum DataType {
    events,
    chores,
    shopping,
    bills,
}

// Interfaces for different data types
interface EventItem {
    id: number;
    name: string;
    description: string;
    date: Date;
    location: string;
    createdBy?: {
        username: string;
    };
}

interface ChoreItem {
    id: number;
    name: string;
    dueDate?: Date;
    assignedTo?: {
        username: string;
    };
}

interface ShoppingItem {
    id: number;
    name: string;
    cost?: number;
    createdBy?: {
        username: string;
    };
}

interface BillItem {
    id: number;
    name: string;
    amount: number;
    dueDate?: Date;
}

// Union type for all possible item types
type CardItemType = EventItem | ChoreItem | ShoppingItem | BillItem;

export function Card({ 
    title, 
    subtitle, 
    dataType, 
    selectedDate 
}: { 
    title: string; 
    subtitle: string; 
    dataType: DataType;
    selectedDate: Date;
}) {
    const [data, setData] = useState<CardItemType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const dateParam = selectedDate.toISOString().split('T')[0];
                let endpoint = '';
                
                switch(dataType) {
                    case DataType.events:
                        endpoint = '/api/overview/events';
                        break;
                    case DataType.chores:
                        endpoint = '/api/overview/chores';
                        break;
                    case DataType.shopping:
                        endpoint = '/api/overview/shoppingList';
                        break;
                    case DataType.bills:
                        endpoint = '/api/overview/bills';
                        break;
                }
                
                const response = await fetch(`${endpoint}?date=${dateParam}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                
                const result = await response.json();
                
                let items: CardItemType[] = [];
                if (dataType === DataType.events && result.events) {
                    items = result.events as EventItem[];
                } else if (dataType === DataType.chores && result.chores) {
                    items = result.chores as ChoreItem[];
                } else if (dataType === DataType.shopping && result.shoppingItems) {
                    items = result.shoppingItems as ShoppingItem[];
                } else if (dataType === DataType.bills && result.bills) {
                    items = result.bills as BillItem[];
                }
                
                setData(items);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data');
                setData([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [dataType, selectedDate]);
    
    const getItemLink = (item: CardItemType) => {
        switch(dataType) {
            case DataType.events:
                return `/events?id=${item.id}`;
            case DataType.chores:
                return `/chores?id=${item.id}`;
            case DataType.shopping:
                return `/shopping?id=${item.id}`;
            case DataType.bills:
                return `/bills?id=${item.id}`;
            default:
                return '#';
        }
    };
    
    const last3DataRecords = () => {
        const hr = <hr className="border-[#27272A] border" />;
        
        if (loading) {
            return (
                <div className="text-[#A1A1AA] text-sm flex justify-center items-center w-full py-4">
                    Loading...
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="text-[#A1A1AA] text-sm flex justify-center items-center w-full py-4">
                    Failed to load data
                </div>
            );
        }
        
        if (data.length === 0) {
            return (
                <div className="text-[#A1A1AA] text-sm flex justify-center items-center w-full py-4">
                    No items available
                </div>
            );
        }

        const recordsToShow = data.slice(Math.max(data.length - 3, 0));
        
        if (dataType == DataType.events || dataType == DataType.chores) {
            let c = 1;
            return recordsToShow.map((record) => {
                return (
                    <span key={`${DataType[dataType]}-${record.id}`}>
                        <Link href={getItemLink(record)} className="flex justify-center items-center w-full hover:bg-zinc-800 rounded-md p-1">
                            <div className="w-3/4 flex justify-start items-center">
                                <h2 className="text-sm font-medium text-[#FAFAFA]">{record.name}</h2>
                            </div>
                            <div className="w-1/4 flex justify-end items-center">
                                <Image src="/ArrowDown.svg" alt="Arrow down icon" width={8} height={4} />
                            </div>
                        </Link>
                        {hr}
                    </span>
                );
            });
        } else if (dataType == DataType.shopping) {
            let c = 1;
            return recordsToShow.map((record) => {
                const item = record as ShoppingItem;
                return (
                    <span key={DataType[dataType].toString() + c++}>
                        <Link href={getItemLink(record)} className="flex flex-wrap justify-between items-center w-full hover:bg-zinc-800 rounded-md p-1">
                            <div className="flex justify-start items-start space-y-1.5 flex-grow ml-2">
                                <h2 className="text-sm font-medium text-[#FAFAFA]">
                                    {item.name}
                                </h2>
                            </div>
                            <div className="text-sm font-normal text-[#A1A1AA] overflow-hidden">
                                {item.cost ? `${item.cost}$` : 'Cost not specified'}
                            </div>
                        </Link>
                        {hr}
                    </span>
                );
            });
        } else if (dataType == DataType.bills) {
            let c = 1;
            return recordsToShow.map((record) => {
                const bill = record as BillItem;
                return (
                    <span key={DataType[dataType].toString() + c++}>
                        <Link href={getItemLink(record)} className="flex flex-wrap justify-between items-center w-full hover:bg-zinc-800 rounded-md p-1">
                            <div className="flex justify-start items-start space-y-1.5 flex-grow ml-2">
                                <h2 className="text-sm font-medium text-[#FAFAFA]">
                                    {bill.name} - {bill.amount}$
                                </h2>
                            </div>
                            <div className="text-sm font-normal text-[#A1A1AA] overflow-hidden">
                                {bill.dueDate
                                    ? 'Due ' +
                                      new Date(bill.dueDate)
                                          .toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                          })
                                          .replace(',', '.')
                                    : 'Optional'}
                            </div>
                        </Link>
                        {hr}
                    </span>
                );
            });
        }
    };

    return (
        <div className="flex flex-col justify-center items-start w-[33%] rounded-xl border border-[#27272A]">
            <div className="flex flex-col justify-center items-start p-6">
                <div className="flex justify-between items-center w-full">
                    <h1 className="text-2xl text-[#FAFAFA] font-semibold gap-[10px]">{title}</h1>
                </div>
                <h3 className="gap-[10px] mt-1.5 font-normal text-[#A1A1AA] text-sm">{subtitle}</h3>
            </div>
            <div className="w-full flex flex-col px-6 pb-6 space-y-4">{last3DataRecords()}</div>
        </div>
    );
}
