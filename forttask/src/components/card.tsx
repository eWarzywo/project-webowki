import Image from 'next/image';
import Link from 'next/link';

export enum DataType {
    events,
    chores,
    shopping,
    bills,
    messages,
}

export function Card({
    title,
    subtitle,
    dataType,
    data,
}: {
    title: string;
    subtitle: string;
    dataType: DataType;
    data: any[];
}) {
    const last3DataRecords = () => {
        const hr = <hr className="border-[#27272A] border" />;
        data.slice(Math.max(data.length - 3, 0));
        if (dataType == DataType.events || dataType == DataType.chores) {
            //Do dodania klucze do mapowania z idków tych recordów
            return data.map((record) => {
                return (
                    <>
                        <Link href="#" className="flex justify-center items-center w-full">
                            <div className="w-3/4 flex justify-start items-center">
                                <h2 className="text-sm font-medium text-[#FAFAFA]">{record}</h2>
                            </div>
                            <div className="w-1/4 flex justify-end items-center">
                                <Image src="/ArrowDown.svg" alt="Arrow down icon" width={8} height={4} />
                            </div>
                        </Link>
                        {hr}
                    </>
                );
            });
        } else if (dataType == DataType.shopping || dataType == DataType.bills) {
            return data.map((record) => {
                return (
                    <>
                        <Link href="#" className="flex flex-wrap justify-between items-center w-full">
                            <div className="border border-[#FAFAFA] rounded-[4px] w-3 h-3 p-1 mx-2 hover:bg-[#FAFAFA]"></div>
                            <div className="flex justify-start items-start space-y-1.5 flex-grow">
                                <h2 className="text-sm font-medium text-[#FAFAFA]">
                                    {record[0]}
                                    {dataType == DataType.bills ? ' - ' + record[1] + '$' : ''}
                                </h2>
                            </div>
                            <div className="text-sm font-normal text-[#A1A1AA] overflow-hidden">
                                {record[2]
                                    ? 'Due ' +
                                      record[2]
                                          .toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                          })
                                          .replace(',', '.')
                                    : dataType == DataType.shopping
                                      ? ''
                                      : 'No due date'}
                            </div>
                        </Link>
                        {hr}
                    </>
                );
            });
        } else if (dataType == DataType.messages) {
            return data.map((record) => {
                return (
                    <>
                        <Link href="#" className="flex flex-wrap justify-start items-center w-full">
                            <div className="rounded-full w-10 h-10 bg-white text-black flex justify-center items-center mr-2">
                                pfp
                            </div>
                            <div className="flex justify-start items-center ml-2 overflow-hidden">
                                {record[0]}
                                <h2 className="ml-2 text-sm font-medium text-[#A1A1AA]">{record[1]}</h2>
                            </div>
                        </Link>
                        {hr}
                    </>
                );
            });
        }
    };

    return (
        <div className="flex flex-col justify-center items-start w-[33%] rounded-xl border border-[#27272A]">
            <div className="flex flex-col justify-center items-start p-6">
                <h1 className="text-2xl text-[#FAFAFA] font-semibold gap-[10px]">{title}</h1>
                <h3 className="gap-[10px] mt-1.5 font-normal text-[#A1A1AA] text-sm">{subtitle}</h3>
            </div>
            <div className="w-full flex flex-col px-6 pb-6 space-y-4">{last3DataRecords()}</div>
        </div>
    );
}
