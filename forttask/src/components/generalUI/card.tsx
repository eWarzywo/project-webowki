import Image from 'next/image';
import Link from 'next/link';
import { format, isSameDay } from 'date-fns';
import { useEffect, useState } from 'react';

export enum DataType {
    events,
    chores,
    shopping,
    bills,
}

type Event = {
    id: number;
    name: string;
    description: string;
    date: string;
    location: string;
}

type Chore = {
    id: number;
    name: string;
    description: string;
    dueDate: string;
    priority: number;
}

type Bill = {
    id: number;
    name: string;
    amount: number;
    dueDate: string;
}

type ShoppingItem = {
    id: number;
    name: string;
    cost: number;
    createdAt: string;
}

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
    const [data, setData] = useState<any[]>([]);
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
                
                let items: any[] = [];
                if (dataType === DataType.events && result.events) {
                    items = result.events;
                } else if (dataType === DataType.chores && result.chores) {
                    items = result.chores;
                } else if (dataType === DataType.shopping && result.shoppingItems) {
                    items = result.shoppingItems;
                } else if (dataType === DataType.bills && result.bills) {
                    items = result.bills;
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
    
    const formattedDate = selectedDate ? format(selectedDate, 'MMM dd, yyyy') : '';

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
                    <span key={DataType[dataType].toString() + c++}>
                        <Link href="#" className="flex justify-center items-center w-full">
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
                return (
                    <span key={DataType[dataType].toString() + c++}>
                        <Link href="#" className="flex flex-wrap justify-between items-center w-full bghover">
                            <div className="border border-[#FAFAFA] rounded-[4px] w-3 h-3 p-1 mx-2"></div>
                            <div className="flex justify-start items-start space-y-1.5 flex-grow">
                                <h2 className="text-sm font-medium text-[#FAFAFA]">
                                    {record.name}
                                </h2>
                            </div>
                            <div className="text-sm font-normal text-[#A1A1AA] overflow-hidden">
                                {record.cost ? `${record.cost}$` : 'Cost not specified'}
                            </div>
                        </Link>
                        {hr}
                    </span>
                );
            });
        } else if (dataType == DataType.bills) {
            let c = 1;
            return recordsToShow.map((record) => {
                return (
                    <span key={DataType[dataType].toString() + c++}>
                        <Link href="#" className="flex flex-wrap justify-between items-center w-full bghover">
                            <div className="border border-[#FAFAFA] rounded-[4px] w-3 h-3 p-1 mx-2"></div>
                            <div className="flex justify-start items-start space-y-1.5 flex-grow">
                                <h2 className="text-sm font-medium text-[#FAFAFA]">
                                    {record.name} - {record.amount}$
                                </h2>
                            </div>
                            <div className="text-sm font-normal text-[#A1A1AA] overflow-hidden">
                                {record.dueDate
                                    ? 'Due ' +
                                      new Date(record.dueDate)
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
