//Dane do pobrania jak matuś zrobi api

import { Card, DataType } from '@/components/generalUI/card';
import Calendar from '@/components/generalUI/calendar';

export default function Dashboard() {
    return (
        <div className="flex flex-col justify-center items-center w-full pt-6 pb-8 px-8">
            <div>
                <h1 className="text-4xl text-white w-full justify-between items-center font-semibold">Dashboard</h1>
            </div>
            <main className="flex justify-center items-center w-full pt-6 pb-8 px-8">
                <div className="flex flex-col w-full justify-center items-center ">
                    <div className=" space-x-4 flex justify-between items-center w-full">
                        <Card
                            title="Upcoming events"
                            subtitle="What's the next step in the operation?"
                            dataType={DataType.events}
                        />
                        <Card
                            title="Chores"
                            subtitle="What's the next step in the operation?"
                            dataType={DataType.chores}
                        />
                        <Card
                            title="Upcoming bills"
                            subtitle="What's the next step in the operation?"
                            dataType={DataType.bills}
                        />
                    </div>
                    <div className="flex justify-center gap-x-3 items-start w-full mt-4">
                        <Card
                            title="Shopping list"
                            subtitle="What's the next step in the operation?"
                            dataType={DataType.shopping}
                        />
                        <Calendar />
                    </div>
                </div>
            </main>
        </div>
    );
}
