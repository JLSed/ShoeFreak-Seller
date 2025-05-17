import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import { fetchSellerSneakers, getCurrentUser } from "../lib/supabase";
import { GiRunningShoe } from "react-icons/gi";

// Update the FilterOptions interface to include material
interface FilterOptions {
  status: "ALL" | "AVAILABLE" | "PENDING" | "SOLD";
  priceRange: { min: number; max: number } | null;
  brand: string;
  category: string;
  materials: {
    leather: boolean;
    synthetic: boolean;
    rubberFoam: boolean;
    ecoFriendly: boolean;
    other: boolean;
  };
}

function ShoeList() {
  const navigate = useNavigate();
  const [sneakers, setSneakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Update the initial state to include materials
  const [filters, setFilters] = useState<FilterOptions>({
    status: "ALL",
    priceRange: null,
    brand: "",
    category: "",
    materials: {
      leather: false,
      synthetic: false,
      rubberFoam: false,
      ecoFriendly: false,
      other: false,
    },
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

  // Update the filtering logic to include materials
  const filteredSneakers = sneakers.filter((shoe) => {
    // Status filter
    if (filters.status !== "ALL" && shoe.status !== filters.status)
      return false;

    // Brand filter
    if (
      filters.brand &&
      !shoe.brand.toLowerCase().includes(filters.brand.toLowerCase())
    )
      return false;

    // Category filter
    if (filters.category && shoe.category !== filters.category) return false;

    // Material filter
    const materialSelected = Object.values(filters.materials).some(
      (value) => value
    );
    if (materialSelected) {
      // If no material data or no matches with selected materials
      if (!shoe.material) return false;

      // Check if any selected material matches the shoe's materials
      const materialMatch = Object.entries(filters.materials).some(
        ([key, isSelected]) => isSelected && shoe.material && shoe.material[key]
      );

      if (!materialMatch) return false;
    }

    // Price range filter
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
              {/* Status filter - unchanged */}
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

              {/* Brand filter - unchanged */}
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

              {/* Category filter - now a dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  className="w-full border rounded-md p-2"
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                >
                  <option value="">All Categories</option>
                  <option value="Casual">Casual</option>
                  <option value="Sports">Sports</option>
                  <option value="Formal">Formal</option>
                  <option value="Specialized">Specialized</option>
                  <option value="Boots">Boots</option>
                  <option value="Slippers/Sandals">Slippers/Sandals</option>
                </select>
              </div>

              {/* NEW Material filter with checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material
                </label>
                <div className="space-y-1">
                  {/* Leather */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="material-leather"
                      checked={filters.materials.leather}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          materials: {
                            ...filters.materials,
                            leather: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="material-leather"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Leather
                    </label>
                  </div>

                  {/* Synthetic */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="material-synthetic"
                      checked={filters.materials.synthetic}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          materials: {
                            ...filters.materials,
                            synthetic: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="material-synthetic"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Synthetic
                    </label>
                  </div>

                  {/* Rubber & Foam */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="material-rubber-foam"
                      checked={filters.materials.rubberFoam}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          materials: {
                            ...filters.materials,
                            rubberFoam: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="material-rubber-foam"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Rubber & Foam
                    </label>
                  </div>

                  {/* Specialty & Eco-Friendly */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="material-eco-friendly"
                      checked={filters.materials.ecoFriendly}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          materials: {
                            ...filters.materials,
                            ecoFriendly: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="material-eco-friendly"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Specialty & Eco-Friendly
                    </label>
                  </div>

                  {/* Other */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="material-other"
                      checked={filters.materials.other}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          materials: {
                            ...filters.materials,
                            other: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="material-other"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Other
                    </label>
                  </div>
                </div>
              </div>

              {/* Price range filter - unchanged */}
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

              {/* Clear filters - update to reset materials too */}
              <button
                className="w-full bg-gray-100 text-gray-600 py-2 rounded-md hover:bg-gray-200"
                onClick={() =>
                  setFilters({
                    status: "ALL",
                    priceRange: null,
                    brand: "",
                    category: "",
                    materials: {
                      leather: false,
                      synthetic: false,
                      rubberFoam: false,
                      ecoFriendly: false,
                      other: false,
                    },
                  })
                }
              >
                Clear Filters
              </button>
            </div>
            <div
              onClick={() => navigate("/publish-sneaker")}
              className="shadow rounded-lg bg-white min-w-[200px] max-w-[220px] flex flex-col items-center p-4 cursor-pointer hover:shadow-xl transition-shadow mt-12"
            >
              <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-lg mb-2">
                <GiRunningShoe className="text-4xl text-gray-400" />
              </div>
              <p className="font-semibold text-gray-600">
                Publish your own sneaker
              </p>
              <p className="text-sm text-gray-400">Click to get started</p>
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
