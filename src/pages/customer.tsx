import { useEffect, useState, useRef } from "react";
import Header from "../components/header";
import {
  getCurrentUser,
  fetchCustomersWithChat,
  fetchMessages,
  sendMessage,
  supabase,
} from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function Customer() {
  const navigate = useNavigate();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState({
    customers: true,
    messages: false,
  });
  const [sellerId, setSellerId] = useState<string | null>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    console.log("hsdf");
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  // Initialize seller and load customers
  useEffect(() => {
    const initialize = async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate("/");
        return;
      }
      setSellerId(user.id);

      try {
        const customersData = await fetchCustomersWithChat(user.id);
        setCustomers(customersData || []);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading((prev) => ({ ...prev, customers: false }));
      }
    };

    initialize();
  }, [navigate]);

  // Load messages when customer is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!sellerId || !selectedCustomer?.user_id) return;

      setLoading((prev) => ({ ...prev, messages: true }));
      try {
        const messagesData = await fetchMessages(
          sellerId,
          selectedCustomer.user_id
        );
        setMessages(messagesData || []);
        // Scroll to bottom after messages load
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading((prev) => ({ ...prev, messages: false }));
      }
    };

    loadMessages();
  }, [sellerId, selectedCustomer]);

  // Real-time message subscription
  useEffect(() => {
    const channel = supabase
      .channel("realitime messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCustomer, sellerId]);

  // Handle sending message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !sellerId || !selectedCustomer?.user_id) return;

    try {
      const response = await sendMessage(
        sellerId,
        selectedCustomer.user_id,
        newMessage.trim(),
        "SELLER"
      );

      if (response.error) {
        console.error("Error sending message:", response.error);
        return;
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="bg-green-900 min-h-screen">
      <Header />
      <main className="pt-20 px-4 flex gap-4 h-[calc(100vh-5rem)]">
        {/* Customer List */}
        <aside className="bg-gray-100 p-4 rounded-lg shadow-lg w-80">
          <h2 className="text-lg font-semibold text-green-900 mb-4">
            Customers
          </h2>
          {loading.customers ? (
            <p className="text-gray-500">Loading customers...</p>
          ) : customers.length === 0 ? (
            <p className="text-gray-500">No chat history yet.</p>
          ) : (
            <ul className="space-y-2 overflow-y-auto max-h-[calc(100vh-12rem)]">
              {customers.map((customer) => (
                <li
                  key={customer.user_id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedCustomer?.user_id === customer.user_id
                      ? "bg-green-600 text-white"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="font-medium">
                    {customer.first_name} {customer.last_name}
                  </div>
                  <div className="text-sm opacity-75">{customer.email}</div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Chat Section */}
        <div className="flex-1 bg-gray-100 rounded-lg shadow-lg overflow-hidden flex flex-col">
          {selectedCustomer ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b">
                <h2 className="text-lg font-semibold text-green-900">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedCustomer.email}
                </p>
              </div>

              {/* Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {loading.messages ? (
                  <p className="text-center text-gray-500">
                    Loading messages...
                  </p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-500">No messages yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === "SELLER"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg ${
                          msg.sender === "SELLER"
                            ? "bg-green-600 text-white"
                            : "bg-white border"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a customer to start chatting
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Customer;
