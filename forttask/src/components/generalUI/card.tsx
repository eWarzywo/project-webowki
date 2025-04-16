import Image from 'next/image';
import Link from 'next/link';

export enum DataType {
    events,
    chores,
    shopping,
    bills,
}

export function Card({ title, subtitle, dataType }: { title: string; subtitle: string; dataType: DataType }) {
    function getData() {
        if (dataType == DataType.events) {
            return ['Jakeing it', 'Jakeing it', 'Jakeing it'];
        }
        if (dataType == DataType.chores) {
            return ['Jakeing it', 'Jakeing it', 'Jakeing it'];
        }
        if (dataType == DataType.shopping) {
            return [['Beer', '24'], ['Vodka'], ['Cigarettes', '10']];
        }
        if (dataType == DataType.bills) {
            return [
                ['Baby oil', 100, new Date('11.17.2025')],
                ['Night with emati', 2, null],
                ['Milion piw', 10000, new Date('07.06.2025')],
            ];
        }
        return [];
    }

    const data: any[] = getData();

    const last3DataRecords = () => {
        const hr = <hr className="border-[#27272A] border" />;
        data.slice(Math.max(data.length - 3, 0));
        if (dataType == DataType.events || dataType == DataType.chores) {
            let c = 1;
            return data.map((record) => {
                return (
                    <span key={DataType[dataType].toString() + c++}>
                        <Link href="#" className="flex justify-center items-center w-full">
                            <div className="w-3/4 flex justify-start items-center">
                                <h2 className="text-sm font-medium text-[#FAFAFA]">{record}</h2>
                            </div>
                            <div className="w-1/4 flex justify-end items-center">
                                <Image src="/ArrowDown.svg" alt="Arrow down icon" width={8} height={4} />
                            </div>
                        </Link>
                        {hr}
                    </span>
                );
            });
        } else if (dataType == DataType.shopping || dataType == DataType.bills) {
            let c = 1;
            return data.map((record) => {
                return (
                    <span key={DataType[dataType].toString() + c++}>
                        <Link href="#" className="flex flex-wrap justify-between items-center w-full bghover">
                            <div className="border border-[#FAFAFA] rounded-[4px] w-3 h-3 p-1 mx-2"></div>
                            <div className="flex justify-start items-start space-y-1.5 flex-grow">
                                <h2 className="text-sm font-medium text-[#FAFAFA]">
                                    {record[0]}
                                    {dataType == DataType.bills ? ' - ' + record[1] + '$' : ''}
                                </h2>
                            </div>
                            <div className="text-sm font-normal text-[#A1A1AA] overflow-hidden">
                                {dataType == DataType.bills
                                    ? record[2]
                                        ? 'Due ' +
                                          record[2]
                                              .toLocaleDateString('en-US', {
                                                  year: 'numeric',
                                                  month: 'short',
                                                  day: 'numeric',
                                              })
                                              .replace(',', '.')
                                        : 'Optional'
                                    : record[1]
                                      ? record[1] + '$'
                                      : 'Cost not specified'}
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
                <h1 className="text-2xl text-[#FAFAFA] font-semibold gap-[10px]">{title}</h1>
                <h3 className="gap-[10px] mt-1.5 font-normal text-[#A1A1AA] text-sm">{subtitle}</h3>
            </div>
            <div className="w-full flex flex-col px-6 pb-6 space-y-4">{last3DataRecords()}</div>
        </div>
    );
}
