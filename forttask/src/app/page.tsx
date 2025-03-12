//Dane do pobrania jak matuś zrobi api

import { Card, DataType } from "@/components/card";

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
              dataType={DataType.events}
              data={["Jakeing it", "Jakeing it", "Jakeing it"]}
            />
            <Card
              title="Chores"
              subtitle="What's the next step in the operation?"
              dataType={DataType.chores}
              data={["Jakeing it", "Jakeing it", "Jakeing it"]}
            />
            <Card
              title="Upcoming bills"
              subtitle="What's the next step in the operation?"
              dataType={DataType.bills}
              data={
                [] /*[["Baby oil", 100], ["Night with emati", 2], ["Milion piw", 10000]]*/
              }
            />
            {/* Przy pobieraniu danych to można wsm zrobić tablice samych idków ostatnich 3 recordów according type i potem pobierać dane */}
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
