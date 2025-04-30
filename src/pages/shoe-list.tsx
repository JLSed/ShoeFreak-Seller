import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import { fetchSellerSneakers, getCurrentUser } from "../lib/supabase";

interface FilterOptions {
  status: "ALL" | "AVAILABLE" | "PENDING" | "SOLD";
  priceRange: { min: number; max: number } | null;
  brand: string;
  category: string;
}

function ShoeList() {
  const navigate = useNavigate();
  const [sneakers, setSneakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    status: "ALL",
    priceRange: null,
    brand: "",
    category: "",
  });

  useEffect(() => {
    const initializeData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate("/");
        return;
      }

      try {
        const data = await fetchSellerSneakers(currentUser.id);
        setSneakers(data || []);
      } catch (error) {
        console.error("Error fetching sneakers:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [navigate]);

  const filteredSneakers = sneakers.filter((shoe) => {
    if (filters.status !== "ALL" && shoe.status !== filters.status)
      return false;
    if (
      filters.brand &&
      !shoe.brand.toLowerCase().includes(filters.brand.toLowerCase())
    )
      return false;
    if (
      filters.category &&
      !shoe.category.toLowerCase().includes(filters.category.toLowerCase())
    )
      return false;
    if (filters.priceRange) {
      const price = Number(shoe.price);
      if (price < filters.priceRange.min || price > filters.priceRange.max)
        return false;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "SOLD":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-green-900 min-h-screen">
      <Header />
      <main className="pt-20 px-4 pb-8">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside className="w-64 bg-white rounded-lg p-4 h-fit">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full border rounded-md p-2"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      status: e.target.value as FilterOptions["status"],
                    })
                  }
                >
                  <option value="ALL">All</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="PENDING">Pending</option>
                  <option value="SOLD">Sold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  value={filters.brand}
                  onChange={(e) =>
                    setFilters({ ...filters, brand: e.target.value })
                  }
                  placeholder="Search brands..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  placeholder="Search categories..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="w-1/2 border rounded-md p-2"
                    placeholder="Min"
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        priceRange: {
                          min: Number(e.target.value),
                          max: filters.priceRange?.max || Infinity,
                        },
                      })
                    }
                  />
                  <input
                    type="number"
                    className="w-1/2 border rounded-md p-2"
                    placeholder="Max"
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        priceRange: {
                          min: filters.priceRange?.min || 0,
                          max: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <button
                className="w-full bg-gray-100 text-gray-600 py-2 rounded-md hover:bg-gray-200"
                onClick={() =>
                  setFilters({
                    status: "ALL",
                    priceRange: null,
                    brand: "",
                    category: "",
                  })
                }
              >
                Clear Filters
              </button>
            </div>
          </aside>

          {/* Sneakers Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <p className="text-white">Loading sneakers...</p>
              ) : filteredSneakers.length === 0 ? (
                <p className="text-white">No sneakers found.</p>
              ) : (
                filteredSneakers.map((shoe) => (
                  <div
                    key={shoe.shoe_id}
                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/shoe/${shoe.shoe_id}`)}
                  >
                    <img
                      src={shoe.image_url || "/placeholder-shoe.png"}
                      alt={shoe.shoe_name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">
                          {shoe.shoe_name}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                            shoe.status || "AVAILABLE"
                          )}`}
                        >
                          {shoe.status || "AVAILABLE"}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{shoe.brand}</p>
                      <p className="text-green-700 font-bold">₱{shoe.price}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ShoeList;
