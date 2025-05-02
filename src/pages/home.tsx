import { useEffect, useState } from "react";
import { GiRunningShoe } from "react-icons/gi";
import { IoMdRefresh } from "react-icons/io";
import Header from "../components/header";
import {
  fetchSellerSneakers,
  getCurrentUser,
  getSellerStats,
  getSellerSalesStats,
  fetchPendingOrders,
} from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [sneakers, setSneakers] = useState<any[]>([]);
  const [loadingSneakers, setLoadingSneakers] = useState(true);
  const [stats, setStats] = useState([
    {
      label: "Total Sales (Today)",
      value: "₱0",
    },
    {
      label: "Shoes Sold",
      value: "0",
    },
    {
      label: "Shoes Listed",
      value: "0",
    },
    {
      label: "Pending Orders",
      value: "0",
    },
    {
      label: "Sales This Month",
      value: "₱0",
    },
  ]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Fetch current user and sneakers
  useEffect(() => {
    const initializeData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate("/"); // Redirect to login if no user
        return;
      }

      setLoadingSneakers(true);
      setLoadingOrders(true);
      try {
        // Fetch seller's sneakers
        const sneakersData = await fetchSellerSneakers(currentUser.id);
        setSneakers(sneakersData || []);

        // Fetch pending orders
        const ordersData = await fetchPendingOrders(currentUser.id);
        setPendingOrders(ordersData || []);

        // Fetch seller's statistics
        const sellerStats = await getSellerStats(currentUser.id);
        const salesStats = await getSellerSalesStats(currentUser.id);

        // Update stats with real data
        setStats((prev) =>
          prev.map((stat) => {
            switch (stat.label) {
              case "Total Sales (Today)":
                return {
                  ...stat,
                  value: `₱${salesStats.todaySales.toFixed(2)}`,
                };
              case "Sales This Month":
                return {
                  ...stat,
                  value: `₱${salesStats.monthSales.toFixed(2)}`,
                };
              case "Shoes Listed":
                return { ...stat, value: sellerStats.listedShoes.toString() };
              case "Shoes Sold":
                return { ...stat, value: sellerStats.soldShoes.toString() };
              case "Pending Orders":
                return { ...stat, value: ordersData.length.toString() };
              default:
                return stat;
            }
          })
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        setSneakers([]);
        setPendingOrders([]);
      }
      setLoadingSneakers(false);
      setLoadingOrders(false);
    };

    initializeData();
  }, [navigate]);

  const refreshSneakers = async () => {
    setLoadingSneakers(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const sneakersData = await fetchSellerSneakers(currentUser.id);
      setSneakers(sneakersData || []);
    } catch (error) {
      console.error("Error refreshing sneakers:", error);
    } finally {
      setLoadingSneakers(false);
    }
  };

  const refreshPendingOrders = async () => {
    setLoadingOrders(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const ordersData = await fetchPendingOrders(currentUser.id);
      setPendingOrders(ordersData || []);

      // Update pending orders count in stats
      setStats((prev) =>
        prev.map((stat) =>
          stat.label === "Pending Orders"
            ? { ...stat, value: ordersData.length.toString() }
            : stat
        )
      );
    } catch (error) {
      console.error("Error refreshing orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const SneakerCard = ({ shoe }: { shoe: any }) => {
    let colors: string[] = [];
    let sizes: string[] = [];
    try {
      colors = shoe.color ? shoe.color : [];
    } catch {
      colors = [];
    }
    try {
      sizes = shoe.size ? shoe.size : [];
    } catch {
      sizes = [];
    }

    return (
      <div
        className="cursor-pointer shadow rounded-lg bg-white min-w-[200px] max-w-[220px] flex flex-col items-center p-4"
        key={shoe.shoe_id}
        onClick={() => navigate(`/shoe/${shoe.shoe_id}`)}
      >
        <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-lg mb-2 overflow-hidden">
          <img
            src={shoe.image_url || "/placeholder-shoe.png"}
            alt={shoe.shoe_name}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="w-full text-center">
          <p className="font-semibold">{shoe.shoe_name || "Shoe Name"}</p>
          <p className="text-green-700 font-bold">
            {shoe.price ? `₱${shoe.price.toFixed(2)}` : "Price"}
          </p>
          <div className="mt-2">
            <span className="text-xs text-gray-500">Colors: </span>
            {colors.length > 0 ? (
              <span className="flex flex-wrap justify-center gap-1">
                {colors.map((color: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-block w-4 h-4 rounded-full border border-black"
                    style={{ backgroundColor: color }}
                    title={color}
                  ></span>
                ))}
              </span>
            ) : (
              <span className="text-xs text-gray-400">N/A</span>
            )}
          </div>
          <div className="mt-1">
            <span className="text-xs text-gray-500">Sizes: </span>
            {sizes.length > 0 ? (
              <span className="flex flex-wrap justify-center gap-1">
                {sizes.map((size: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-block bg-gray-200 rounded px-2 py-0.5 text-xs"
                  >
                    {size}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-xs text-gray-400">N/A</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-green-900 min-h-screen">
      <Header />
      <main className="pt-20 px-4 pb-8 space-y-12">
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

        <div className="bg-gray-100 rounded-lg py-4 shadow-lg">
          <span className="text-gray-600 text-center flex gap-2 border-b-2 w-full font-poppins pb-2 px-4 border-gray-300">
            <GiRunningShoe className="text-2xl" />
            Your Sneakers
            <IoMdRefresh
              className="text-2xl cursor-pointer"
              onClick={refreshSneakers}
            />
          </span>
          <div className="flex gap-8 overflow-x-auto px-4 py-4">
            {loadingSneakers ? (
              <p className="text-gray-500">Loading sneakers...</p>
            ) : sneakers.filter((shoe) => shoe.status === "AVAILABLE")
                .length === 0 ? (
              <div
                onClick={() => navigate("/publish-sneaker")}
                className="shadow rounded-lg bg-white min-w-[200px] max-w-[220px] flex flex-col items-center p-4 cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-lg mb-2">
                  <GiRunningShoe className="text-4xl text-gray-400" />
                </div>
                <p className="font-semibold text-gray-600">
                  Publish your own sneaker
                </p>
                <p className="text-sm text-gray-400">Click to get started</p>
              </div>
            ) : (
              sneakers
                .filter((shoe) => shoe.status === "AVAILABLE")
                .map((shoe) => <SneakerCard key={shoe.shoe_id} shoe={shoe} />)
            )}
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg py-4 shadow-lg">
          <span className="text-gray-600 text-center flex gap-2 border-b-2 w-full font-poppins pb-2 px-4 border-gray-300">
            <GiRunningShoe className="text-2xl" />
            Pending Orders
            <IoMdRefresh
              className="text-2xl cursor-pointer"
              onClick={refreshPendingOrders}
            />
          </span>
          <div className="flex gap-8 overflow-x-auto px-4 py-4">
            {loadingOrders ? (
              <p className="text-gray-500">Loading orders...</p>
            ) : pendingOrders.length === 0 ? (
              <p className="text-gray-500">No pending orders</p>
            ) : (
              pendingOrders.map((order) => (
                <div
                  key={order.checkout_id}
                  className="cursor-pointer shadow rounded-lg bg-white min-w-[200px] max-w-[220px] flex flex-col items-center p-4"
                  onClick={() => navigate(`/order/${order.checkout_id}`)}
                >
                  <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-lg mb-2 overflow-hidden">
                    <img
                      src={order.shoe.image_url || "/placeholder-shoe.png"}
                      alt={order.shoe.shoe_name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="w-full text-center">
                    <p className="font-semibold">{order.shoe.shoe_name}</p>
                    <p className="text-green-700 font-bold">
                      ₱{order.shoe.price.toFixed(2)}
                    </p>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>
                        Buyer: {order.buyer.first_name} {order.buyer.last_name}
                      </p>
                      <p className="text-xs">{order.buyer.email}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg py-4 shadow-lg">
          <span className="text-gray-600 text-center flex gap-2 border-b-2 w-full font-poppins pb-2 px-4 border-gray-300">
            <GiRunningShoe className="text-2xl" />
            Sold Sneakers
          </span>
          <div className="flex gap-8 overflow-x-auto px-4 py-4">
            {loadingSneakers ? (
              <p className="text-gray-500">Loading sneakers...</p>
            ) : sneakers.filter((shoe) => shoe.status === "SOLD").length ===
              0 ? (
              <p className="text-gray-500">No shoes sold yet</p>
            ) : (
              sneakers
                .filter((shoe) => shoe.status === "SOLD")
                .map((shoe) => <SneakerCard key={shoe.shoe_id} shoe={shoe} />)
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
