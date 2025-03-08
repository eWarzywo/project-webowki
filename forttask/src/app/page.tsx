export default function Home() {
  return <Dashboard />;
}

function Dashboard() {
  return (
    <div className="flex flex-col justify-center items-center w-full pt-6 pb-8 px-8">
      <div>
        <h1 className="text-4xl text-white w-full justify-between items-center font-semibold">
          Dashboard
        </h1>
      </div>
      <main className="flex justify-center items-center w-full pt-6 pb-8 px-8">
        <div className="flex w-full justify-center items-center mt-4">
          <div className="mt-4 space-x-4 flex justify-between items-center w-full">
            {/*3 razy card*/}
          </div>
          <div className="flex justify-between items-center w-full">
            {/*Card, kalendarz, Card*/}
          </div>
        </div>
      </main>
    </div>
  );
}

function Calendar() {
  return (
    <div className="flex flex-col justify-center items-center w-full pt-6 pb-8 px-8">
      <div>
        <h1 className="text-4xl text-white w-full justify-center items-center font-semibold">
          Calendar
        </h1>
      </div>
      <main></main>
    </div>
  );
}
