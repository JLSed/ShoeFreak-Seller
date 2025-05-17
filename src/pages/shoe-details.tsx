import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/header";
import { fetchSneaker, updateSneaker } from "../lib/supabase";

function ShoeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shoe, setShoe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    shoeName: "",
    brand: "",
    category: "",
    description: "",
    price: "",
    colors: [""],
    sizes: [""],
    status: "AVAILABLE",
    materials: {} as Record<string, boolean>,
  });

  useEffect(() => {
    const loadShoe = async () => {
      if (!id) return;
      try {
        const data = await fetchSneaker(id);
        setShoe(data);
        setFormData({
          shoeName: data.shoe_name,
          brand: data.brand,
          category: data.category,
          description: data.description,
          price: data.price.toString(),
          colors: data.color || [],
          sizes: data.size || [],
          status: data.status || "AVAILABLE",
          materials: data.material || {}, // Add material data
        });
      } catch (error) {
        console.error("Error loading shoe:", error);
        navigate("/shoe-list");
      } finally {
        setLoading(false);
      }
    };

    loadShoe();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await updateSneaker(id, {
        shoe_name: formData.shoeName,
        brand: formData.brand,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        color: formData.colors,
        size: formData.sizes,
        status: formData.status,
        material: formData.materials, // Add materials to the update
      });
      setEditing(false);
      // Reload shoe data
      const updatedShoe = await fetchSneaker(id);
      setShoe(updatedShoe);
    } catch (error) {
      console.error("Error updating shoe:", error);
    }
  };

  if (loading) {
    return (
      <div className="bg-green-900 min-h-screen">
        <Header />
        <main className="pt-20 px-4">
          <p className="text-white">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-green-900 min-h-screen">
      <Header />
      <main className="pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-white hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </button>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">Shoe Details</h1>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                onClick={() => setEditing(!editing)}
              >
                {editing ? "Cancel" : "Edit"}
              </button>
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Shoe Name
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        value={formData.shoeName}
                        onChange={(e) =>
                          setFormData({ ...formData, shoeName: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Brand
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData({ ...formData, brand: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Materials
                      </label>
                      <div className="space-y-2">
                        {[
                          { key: "leather", label: "Leather" },
                          { key: "synthetic", label: "Synthetic" },
                          { key: "rubberFoam", label: "Rubber & Foam" },
                          {
                            key: "ecoFriendly",
                            label: "Specialty & Eco-Friendly",
                          },
                          { key: "other", label: "Other" },
                        ].map((material) => (
                          <div key={material.key} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`material-${material.key}`}
                              checked={
                                formData.materials[material.key] || false
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  materials: {
                                    ...formData.materials,
                                    [material.key]: e.target.checked,
                                  },
                                })
                              }
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={`material-${material.key}`}
                              className="ml-2 block text-sm text-gray-700"
                            >
                              {material.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Price (₱)
                      </label>
                      <input
                        type="number"
                        required
                        min="0.0"
                        step={"0.01"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        required
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Colors (comma-separated)
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        value={formData.colors.join(", ")}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            colors: e.target.value
                              .split(",")
                              .map((c) => c.trim()),
                          })
                        }
                        placeholder="e.g., red, blue, #FF0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sizes (comma-separated)
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        value={formData.sizes.join(", ")}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sizes: e.target.value
                              .split(",")
                              .map((s) => s.trim()),
                          })
                        }
                        placeholder="e.g., 9, 10, 11"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="PENDING">Pending</option>
                        <option value="SOLD">Sold</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={shoe.image_url || "/placeholder-shoe.png"}
                    alt={shoe.shoe_name}
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold">{shoe.shoe_name}</h2>
                    <p className="text-gray-600">{shoe.brand}</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    ₱{shoe.price}
                  </p>
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">{shoe.description}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Category</h3>
                    <p className="text-gray-600">{shoe.category}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Materials</h3>
                    <div className="flex flex-wrap gap-2">
                      {shoe.material &&
                        Object.entries(shoe.material).map(([key, value]) => {
                          // Only display true values
                          if (value === true) {
                            // Convert camelCase to readable format
                            const materialName = key
                              .replace(/([A-Z])/g, " $1") // Add space before capital letters
                              .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter

                            // Handle special case
                            const displayName =
                              key === "rubberFoam"
                                ? "Rubber & Foam"
                                : key === "ecoFriendly"
                                ? "Specialty & Eco-Friendly"
                                : materialName;

                            return (
                              <span
                                key={key}
                                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                              >
                                {displayName}
                              </span>
                            );
                          }
                          return null;
                        })}
                      {(!shoe.material ||
                        Object.values(shoe.material).every(
                          (v) => v !== true
                        )) && (
                        <span className="text-gray-500">
                          No materials specified
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Status</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        shoe.status === "SOLD"
                          ? "bg-red-100 text-red-800"
                          : shoe.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {shoe.status || "AVAILABLE"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Available Colors</h3>
                    <div className="flex gap-2">
                      {shoe.color?.map((color: string, index: number) => (
                        <span
                          key={index}
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Available Sizes</h3>
                    <div className="flex flex-wrap gap-2">
                      {shoe.size?.map((size: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ShoeDetails;
