import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/header";
import {
  fetchOrder,
  getCurrentUser,
  createNotification,
  completeOrder,
  cancelOrder,
  recordSale,
} from "../lib/supabase";
import { IoMdArrowBack } from "react-icons/io";
import { BsChatDots } from "react-icons/bs";

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isConfirmingComplete, setIsConfirmingComplete] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;

      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate("/");
          return;
        }

        const orderData = await fetchOrder(id);
        console.log(orderData);
        if (!orderData) {
          navigate("/home");
          return;
        }
        setOrder(orderData);
      } catch (error) {
        console.error("Error loading order:", error);
        navigate("/home");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, navigate]);

  const handleCompleteOrder = async () => {
    if (!order) return;
    setUpdateLoading(true);
    try {
      // First complete the order
      const result = await completeOrder(order.checkout_id, order.shoe.shoe_id);
      if (result.error) {
        console.error("Error completing order:", result.error);
        return;
      }

      // Create a notification for the buyer
      const currentUser = await getCurrentUser();
      if (currentUser) {
        // Add notification
        await createNotification(
          `Your order for ${order.shoe.shoe_name} has been completed and is ready for shipping.`,
          currentUser.id,
          order.buyer.user_id,
          order.shoe.shoe_id
        );

        // Record the sale
        await recordSale(
          order.shoe.shoe_id,
          currentUser.id,
          order.buyer.user_id,
          order.shoe.price
        );
      }

      // Reload order data
      const updatedOrder = await fetchOrder(order.checkout_id);
      setOrder(updatedOrder);
    } catch (error) {
      console.error("Error completing order:", error);
    } finally {
      setUpdateLoading(false);
      setIsConfirmingComplete(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setUpdateLoading(true);
    try {
      // First cancel the order
      const result = await cancelOrder(order.checkout_id);
      if (result.error) {
        console.error("Error cancelling order:", result.error);
        return;
      }

      // Create a notification about the cancellation
      const currentUser = await getCurrentUser();
      if (currentUser) {
        await createNotification(
          `Order for ${order.shoe.shoe_name} has been cancelled by the seller.`,
          currentUser.id,
          order.buyer.user_id,
          order.shoe.shoe_id
        );
      }

      // Reload order data
      const updatedOrder = await fetchOrder(order.checkout_id);
      setOrder(updatedOrder);
    } catch (error) {
      console.error("Error cancelling order:", error);
    } finally {
      setUpdateLoading(false);
      setIsConfirmingCancel(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-green-900 min-h-screen">
        <Header />
        <main className="pt-20 px-4">
          <p className="text-white">Loading order details...</p>
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
            <IoMdArrowBack className="text-xl" />
            Back
          </button>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-semibold">Order Details</h1>
              <button
                onClick={() => navigate(`/messages`)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <BsChatDots />
                Chat with Buyer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Shoe Details */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold border-b pb-2">
                  Shoe Information
                </h2>
                <div className="aspect-square max-w-sm rounded-lg overflow-hidden">
                  <img
                    src={order.shoe.image_url || "/placeholder-shoe.png"}
                    alt={order.shoe.shoe_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-xl">
                    {order.shoe.shoe_name}
                  </p>
                  <p className="text-gray-600">{order.shoe.brand}</p>
                  <p className="text-2xl font-bold text-green-700">
                    ₱{order.shoe.price.toFixed(2)}
                  </p>
                </div>

                {/* Colors */}
                <div>
                  <p className="font-semibold mb-2">Colors:</p>
                  <div className="flex gap-2">
                    {order.shoe.color?.map((color: string, idx: number) => (
                      <span
                        key={idx}
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <p className="font-semibold mb-2">Sizes:</p>
                  <div className="flex flex-wrap gap-2">
                    {order.shoe.size?.map((size: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order and Buyer Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold border-b pb-2">
                    Buyer Information
                  </h2>
                  <div className="mt-4 space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {order.buyer.first_name} {order.buyer.last_name}
                    </p>
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      {order.buyer.email}
                    </p>
                    <p>
                      <span className="font-semibold">Contact:</span>{" "}
                      {order.buyer.contact_number}
                    </p>
                    <p>
                      <span className="font-semibold">Address:</span>{" "}
                      {order.buyer.address}
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold border-b pb-2">
                    Order Information
                  </h2>
                  <div className="mt-4 space-y-2">
                    <p>
                      <span className="font-semibold">Order ID:</span>{" "}
                      {order.checkout_id}
                    </p>
                    <p>
                      <span className="font-semibold">Date Ordered:</span>{" "}
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-semibold">Status:</span>{" "}
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        {order.status}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold">Payment Method:</span>{" "}
                      {order.payment_method}
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold border-b pb-2 mb-4">
                    Change Order Status
                  </h2>
                  {order.status === "PENDING" ? (
                    <div className="flex gap-4">
                      <button
                        onClick={() => setIsConfirmingComplete(true)}
                        disabled={updateLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        Order Complete
                      </button>
                      <button
                        onClick={() => setIsConfirmingCancel(true)}
                        disabled={updateLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Order Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Order status is {order.status.toLowerCase()}. No further
                      actions available.
                    </p>
                  )}

                  {/* Cancel Confirmation Modal */}
                  {isConfirmingCancel && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">
                          Cancel Order?
                        </h3>
                        <p className="text-gray-600 mb-6">
                          This action will void the order and cannot be
                          reverted. Are you sure you want to continue?
                        </p>
                        <div className="flex justify-end gap-4">
                          <button
                            onClick={() => setIsConfirmingCancel(false)}
                            disabled={updateLoading}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            No, Keep Order
                          </button>
                          <button
                            onClick={handleCancelOrder}
                            disabled={updateLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            {updateLoading
                              ? "Cancelling..."
                              : "Yes, Cancel Order"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Complete Order Confirmation Modal */}
                  {isConfirmingComplete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">
                          Complete Order?
                        </h3>
                        <p className="text-gray-600 mb-6">
                          By clicking confirm, you acknowledge that:
                          <ul className="list-disc ml-6 mt-2">
                            <li>
                              You have received the payment for this order
                            </li>
                            <li>
                              The shoes are ready to be shipped to the buyer
                            </li>
                            <li>The shoe's status will be marked as SOLD</li>
                          </ul>
                        </p>
                        <div className="flex justify-end gap-4">
                          <button
                            onClick={() => setIsConfirmingComplete(false)}
                            disabled={updateLoading}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              handleCompleteOrder();
                              setIsConfirmingComplete(false);
                            }}
                            disabled={updateLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {updateLoading ? (
                              <div className="flex items-center gap-2">
                                <svg
                                  className="animate-spin h-5 w-5"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Processing...
                              </div>
                            ) : (
                              "Yes, Complete Order"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default OrderDetails;
