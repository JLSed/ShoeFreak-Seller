import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Sign up a new seller
export async function signUp(
  password: string,
  firstName: string,
  address: string,
  lastName: string,
  email: string,
  contactNumber: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) return { response: false, message: error.message };

  if (data.user?.id) {
    const { data: userData, error: userError } = await supabase
      .from("Users")
      .insert([
        {
          user_id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          contact_number: contactNumber,
          address: address,
          type: "SELLER",
        },
      ]);
    if (userError) return { response: false, message: userError.message };
    return { response: true, auth_data: data, user_data: userData };
  }

  return { response: false, message: "User ID is undefined" };
}

// Sign out the current user
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
  return true;
}

// Sign in an existing user
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { response: false, message: error.message };
  return { response: true, data };
}

// Fetch sneakers for the marketplace
export async function fetchSneakers() {
  const { data, error } = await supabase
    .from("Shoes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Fetch customers (users with type "CUSTOMER")
export async function fetchCustomers() {
  const { data, error } = await supabase
    .from("Users")
    .select("user_id, first_name, last_name, email")
    .eq("type", "CUSTOMER");
  if (error) throw new Error(error.message);
  return data;
}

// Fetch messages between a seller and a customer
export async function fetchMessages(sellerId: string, customerId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// Send a message from a seller to a customer
export async function sendMessage(
  sellerId: string,
  customerId: string,
  message: string,
  sender: "SELLER" | "CUSTOMER"
) {
  const { data, error } = await supabase.from("messages").insert([
    {
      seller_id: sellerId,
      customer_id: customerId,
      message: message,
      sender: sender,
    },
  ]);
  if (error) {
    console.log(data, error);
    return { error: error.message };
  }
  return { data: data };
}
