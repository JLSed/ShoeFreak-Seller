import Header from "../components/header";

function Home() {
  // for demonstration
  const stats = [
    {
      label: "Total Sales (Today)",
      value: "₱12,500",
    },
    {
      label: "Shoes Sold",
      value: "34",
    },
    {
      label: "Shoes Listed",
      value: "120",
    },
    {
      label: "Pending Orders",
      value: "7",
    },
    {
      label: "Sales This Month",
      value: "₱98,000",
    },
  ];

  return (
    <div className="bg-green-900 min-h-screen">
      <Header />
      <main className="pt-20 px-4">
        <h1 className="text-4xl font-gochi_hand font-bold text-white mb-4">
          Dashboard Overview
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl shadow-lg flex flex-col items-center bg-gray-100 text-green-900 p-4 px-0`}
            >
              <span className="text-sm text-gray-600 text-center border-b-2 w-full font-poppins pb-2 border-gray-300">
                {stat.label}
              </span>
              <span className="text-2xl font-semibold my-4 font-outfit">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-gray-100 rounded-lg mt-12 p-4 shadow-lg">
          <span className="text-sm text-gray-600 text-center border-b-2 w-full font-poppins pb-2 border-gray-300">
            Shoe Listing
          </span>
        </div>
      </main>
    </div>
  );
}

export default Home;
