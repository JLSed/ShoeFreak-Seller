import { useEffect, useState } from "react";
import Header from "../components/header";
import { fetchSneakers } from "../lib/supabase";

function Marketplace() {
  const [sneakers, setSneakers] = useState<any[]>([]);
  const [loadingSneakers, setLoadingSneakers] = useState(true);
  const [filter, setFilter] = useState({ color: "", size: "" });

  useEffect(() => {
    const getSneakers = async () => {
      setLoadingSneakers(true);
      try {
        const data = await fetchSneakers();
        setSneakers(data || []);
      } catch {
        setSneakers([]);
      }
      setLoadingSneakers(false);
    };
    getSneakers();
  }, []);

  const filteredSneakers = sneakers.filter((shoe) => {
    // Only show available shoes and apply filters
    const matchesColor =
      !filter.color ||
      (shoe.color &&
        shoe.color.some((c: string) =>
          c.toLowerCase().includes(filter.color.toLowerCase())
        ));
    const matchesSize =
      !filter.size || (shoe.size && shoe.size.includes(filter.size));

    return matchesColor && matchesSize;
  });

  return (
    <div className="bg-green-900 min-h-screen">
      <Header />
      <main className="pt-20 px-4">
        <h1 className="text-4xl font-gochi_hand font-bold text-white mb-4">
          Marketplace
        </h1>
        <div className="flex gap-4">
          {/* Filter Section */}
          <aside className="bg-gray-100 p-4 rounded-lg shadow-lg w-64">
            <h2 className="text-lg font-semibold text-green-900 mb-4">
              Filters
            </h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Color</label>
              <input
                type="text"
                placeholder="Enter color (e.g., red)"
                className="w-full border rounded-lg p-2"
                value={filter.color}
                onChange={(e) =>
                  setFilter({ ...filter, color: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Size</label>
              <input
                type="text"
                placeholder="Enter size (e.g., 10)"
                className="w-full border rounded-lg p-2"
                value={filter.size}
                onChange={(e) => setFilter({ ...filter, size: e.target.value })}
              />
            </div>
            <button
              className="bg-green-600 text-white py-2 px-4 rounded-lg w-full"
              onClick={() => setFilter({ color: "", size: "" })}
            >
              Clear Filters
            </button>
          </aside>

          {/* Sneakers Grid */}
          <div className="flex-1">
            {loadingSneakers ? (
              <p className="text-gray-500">Loading sneakers...</p>
            ) : filteredSneakers.length === 0 ? (
              <p className="text-gray-500">No sneakers found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredSneakers.map((shoe) => {
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
                      className="shadow rounded-lg bg-white flex flex-col items-center p-4"
                      key={shoe.shoe_id}
                    >
                      <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-lg mb-2 overflow-hidden">
                        <img
                          src={shoe.image_url || "/placeholder-shoe.png"}
                          alt={shoe.shoe_name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="w-full text-center">
                        <p className="font-semibold">
                          {shoe.shoe_name || "Shoe Name"}
                        </p>
                        <p className="text-green-700 font-bold">
                          {shoe.price ? `₱${shoe.price.toFixed(2)}` : "Price"}
                        </p>
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">
                            Colors:{" "}
                          </span>
                          {colors.length > 0 ? (
                            <span className="flex flex-wrap justify-center gap-1">
                              {colors.map((color: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-block w-4 h-4 rounded-full border border-gray-300"
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
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Marketplace;
