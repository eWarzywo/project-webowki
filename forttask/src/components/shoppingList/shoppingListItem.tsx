import Image from 'next/image';

export default function ShoppingListItem({ name, cost, userName }: { name: string; cost: number; userName: string }) {
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
