import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, publishSneaker } from "../lib/supabase";
import Header from "../components/header";
import { IoIosArrowBack } from "react-icons/io";

function PublishSneaker() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    shoeName: "",
    brand: "",
    category: "",
    description: "",
    price: "",
    colors: [""],
    sizes: [""],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    const fetchSellerId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSellerId(user?.id || null);
    };
    fetchSellerId();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleColorChange = (index: number, value: string) => {
    const newColors = [...formData.colors];
    newColors[index] = value;
    setFormData({ ...formData, colors: newColors });
  };

  const handleSizeChange = (index: number, value: string) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = value;
    setFormData({ ...formData, sizes: newSizes });
  };

  const addColorField = () => {
    setFormData({ ...formData, colors: [...formData.colors, ""] });
  };

  const addSizeField = () => {
    setFormData({ ...formData, sizes: [...formData.sizes, ""] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerId || !imageFile) return;

    setLoading(true);
    try {
      const response = await publishSneaker({
        sellerId,
        imageFile,
        shoeName: formData.shoeName,
        brand: formData.brand,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        colors: formData.colors.filter(Boolean),
        sizes: formData.sizes.filter(Boolean),
      });

      if (response.error) {
        alert(response.error);
      } else {
        navigate("/home");
      }
    } catch (error) {
      console.error("Error publishing sneaker:", error);
      alert("Failed to publish sneaker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-green-900 min-h-screen">
      <Header />
      <main className="pt-20 px-4">
        <div
          className="flex gap-2 items-center text-2xl font-poppins text-white cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <IoIosArrowBack className="text-3xl" />
          <p>Go Back</p>
        </div>
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-semibold mb-6">Publish New Sneaker</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price (₱)
              </label>
              <input
                type="number"
                required
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Colors
              </label>
              {formData.colors.map((color, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <input
                    type="text"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    placeholder="Enter color (e.g., red, #FF0000)"
                  />
                  {index === formData.colors.length - 1 && (
                    <button
                      type="button"
                      onClick={addColorField}
                      className="px-3 py-1 bg-green-600 text-white rounded-md"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sizes
              </label>
              {formData.sizes.map((size, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <input
                    type="text"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    value={size}
                    onChange={(e) => handleSizeChange(index, e.target.value)}
                    placeholder="Enter size (e.g., 9, 42, M)"
                  />
                  {index === formData.sizes.length - 1 && (
                    <button
                      type="button"
                      onClick={addSizeField}
                      className="px-3 py-1 bg-green-600 text-white rounded-md"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
            >
              {loading ? "Publishing..." : "Publish Sneaker"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default PublishSneaker;
