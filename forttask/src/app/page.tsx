export default function Dashboard() {
  return (
    <div className="flex flex-col justify-center items-center w-full pt-6 pb-8 px-8">
      <div>
        <h1 className="text-4xl text-white w-full justify-between items-center font-semibold">
          Dashboard
        </h1>
      </div>
      <main className="flex justify-center items-center w-full pt-6 pb-8 px-8">
        <div className="flex flex-col w-full justify-center items-center mt-4">
          <div className="mt-4 space-x-4 flex justify-between items-center w-full">
            <Card
              title="Upcoming events"
              subtitle="What's the next step in the operation?"
              dataType="events"
              data={["Jakeing it", "Jakeing it", "Jakeing it"]}
            />
          </div>
          <div className="flex justify-around items-center w-full"></div>
        </div>
      </main>
    </div>
  );
}

function Calendar() {
  return (
    <div className="flex flex-col justify-center items-center w-[15%] p-3 space-x-4 rounded-xl border border-[#27272A]">
      <div>
        <h1 className="text-4xl text-white w-full justify-center items-center font-semibold">
          Calendar
        </h1>
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  dataType,
  data,
}: {
  title: string;
  subtitle: string;
  dataType: string;
  data: string[];
}) {
  return (
    <div className="flex flex-col justify-center items-start w-[30%] rounded-xl border border-[#27272A]">
      <div className="flex flex-col justify-center items-start p-6">
        <h1 className="text-2xl text-[#FAFAFA] font-semibold gap-[10px]">
          {title}
        </h1>
        <h3 className="gap-[10px] mt-1.5 font-normal text-[#A1A1AA]">
          {subtitle}
        </h3>
      </div>
    </div>
  );
}
