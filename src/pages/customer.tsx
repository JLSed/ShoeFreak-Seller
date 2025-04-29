import { useEffect, useState } from "react";
import Header from "../components/header";
import {
  supabase,
  fetchCustomers,
  fetchMessages,
  sendMessage,
} from "../lib/supabase";

function Customer() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);

  // Fetch the current seller's ID
  useEffect(() => {
    const fetchSellerId = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching seller ID:", error);
      } else {
        setSellerId(user?.id || null);
      }
    };
    fetchSellerId();
  }, []);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await fetchCustomers();
        setCustomers(data || []);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    loadCustomers();
  }, []);

  const loadMessages = async (customerId: string) => {
    setLoadingMessages(true);
    try {
      if (!sellerId) throw new Error("Seller ID is undefined");
      const data = await fetchMessages(sellerId, customerId);
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
    setLoadingMessages(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      if (!sellerId || !selectedCustomer?.user_id)
        throw new Error("Invalid IDs");
      const response = await sendMessage(
        sellerId,
        selectedCustomer.user_id,
        newMessage,
        "SELLER"
      );
      if (response.error) {
        console.log(response.error);
      } else if (response.data && Array.isArray(response.data)) {
        setMessages((prev) => [...prev, response.data[0]]);
      }
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleCustomerClick = (customer: any) => {
    setSelectedCustomer(customer);
    loadMessages(customer.user_id);
  };

  useEffect(() => {
    const channel = supabase
      .channel("realitime messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          console.log(payload);
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCustomer, sellerId]);

  return (
    <div className="bg-green-900 min-h-screen">
      <Header />
      <main className="pt-20 px-4 flex">
        {/* Customer List */}
        <aside className="bg-gray-100 p-4 rounded-lg shadow-lg w-64">
          <h2 className="text-lg font-semibold text-green-900 mb-4">
            Customers
          </h2>
          <ul className="space-y-2">
            {customers.map((customer) => (
              <li
                key={customer.id}
                className={`p-2 rounded-lg cursor-pointer ${
                  selectedCustomer?.id === customer.id
                    ? "bg-green-600 text-white"
                    : "hover:bg-gray-200"
                }`}
                onClick={() => handleCustomerClick(customer)}
              >
                {customer.first_name} {customer.last_name}
              </li>
            ))}
          </ul>
        </aside>

        {/* Messages Section */}
        <div className="flex-1 bg-gray-100 p-4 rounded-lg shadow-lg ml-4">
          {selectedCustomer ? (
            <>
              <h2 className="text-lg font-semibold text-green-900 mb-4">
                Messages with {selectedCustomer.first_name}{" "}
                {selectedCustomer.last_name}
              </h2>
              <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-white">
                {loadingMessages ? (
                  <p className="text-gray-500">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-gray-500">No messages yet.</p>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`mb-2 ${
                        msg.sender === "SELLER"
                          ? "text-right"
                          : "text-left text-green-900"
                      }`}
                    >
                      <p
                        className={`inline-block px-4 py-2 rounded-lg ${
                          msg.sender === "SELLER"
                            ? "bg-green-600 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        {msg.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 border rounded-lg p-2"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg ml-2"
                  onClick={handleSendMessage}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-500">Select a customer to view messages.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default Customer;
