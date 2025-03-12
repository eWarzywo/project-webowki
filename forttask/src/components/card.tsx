import Image from "next/image";

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
            <div className="flex justify-center items-center w-full">
              <div className="w-1/2 flex justify-start items-center">
                <h2 className="text-sm font-medium text-[#FAFAFA]">{record}</h2>
              </div>
              <div className="w-1/2 flex justify-end items-center">
                <Image
                  src="/ArrowDown.svg"
                  alt="Arrow down icon"
                  width={8}
                  height={4}
                />
              </div>
            </div>
            {hr}
          </>
        );
      });
    } else if (dataType == DataType.shopping || dataType == DataType.bills) {
      return data.map((record) => {
        return (
          <>
            <div className="flex justify-center items-center w-full"></div>
            {hr}
          </>
        );
      });
    }
  };

  return (
    <div className="flex flex-col justify-center items-start w-[33%] rounded-xl border border-[#27272A]">
      <div className="flex flex-col justify-center items-start p-6">
        <h1 className="text-2xl text-[#FAFAFA] font-semibold gap-[10px]">
          {title}
        </h1>
        <h3 className="gap-[10px] mt-1.5 font-normal text-[#A1A1AA] text-sm">
          {subtitle}
        </h3>
      </div>
      <div className="w-full flex flex-col px-6 pb-6 space-y-4">
        {last3DataRecords()}
      </div>
    </div>
  );
}
