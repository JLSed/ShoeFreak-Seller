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
    .select(
      `
      *,
      publisher:published_by(
        user_id,
        first_name,
        last_name
      )
    `
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Fetch sneakers for the current seller
export async function fetchSellerSneakers(sellerId: string) {
  const { data, error } = await supabase
    .from("Shoes")
    .select(
      `
      *,
      publisher:published_by(
        user_id,
        first_name,
        last_name
      )
    `
    )
    .eq("published_by", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Fetch customers who have messaged the current seller
export async function fetchCustomers(sellerId: string) {
  const { data, error } = await supabase
    .from("Users")
    .select(
      `
      user_id,
      first_name,
      last_name,
      email
    `
    )
    .eq("type", "CUSTOMER")
    .then(async () => {
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("customer_id")
        .eq("seller_id", sellerId);

      if (messagesError) throw new Error(messagesError.message);

      const customerIds = messages?.map((message) => message.customer_id) || [];

      return supabase
        .from("Users")
        .select(
          `
          user_id,
          first_name,
          last_name,
          email
        `
        )
        .eq("type", "CUSTOMER")
        .in("user_id", customerIds);
    });

  if (error) throw new Error(error.message);

  return data || [];
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
): Promise<{ data: any[]; error: any }> {
  const { data, error } = await supabase.from("messages").insert([
    {
      seller_id: sellerId,
      customer_id: customerId,
      message: message,
      sender: sender,
    },
  ]);
  return { data: data || [], error };
}

interface PublishSneakerParams {
  sellerId: string;
  imageFile: File;
  shoeName: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  colors: string[];
  sizes: string[];
}

export async function publishSneaker({
  sellerId,
  imageFile,
  shoeName,
  brand,
  category,
  description,
  price,
  colors,
  sizes,
}: PublishSneakerParams) {
  try {
    // Generate a random file name for the image
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `shoes/${fileName}`;

    // Upload image to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    // Get the public URL of the uploaded image
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath);

    // Insert the sneaker data into the database
    const { data, error } = await supabase
      .from("Shoes")
      .insert([
        {
          shoe_name: shoeName,
          brand,
          category,
          description,
          price,
          color: colors,
          size: sizes,
          image_url: publicUrl,
          published_by: sellerId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error("Error publishing sneaker:", error);
    return { error: "Failed to publish sneaker" };
  }
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting current user:", error.message);
    return null;
  }

  if (!user) return null;

  // Get additional user data from Users table
  const { data: userData, error: userError } = await supabase
    .from("Users")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (userError) {
    console.error("Error getting user data:", userError.message);
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    ...userData,
  };
}

// Get seller's statistics
export async function getSellerStats(sellerId: string) {
  try {
    // Get all shoes by seller
    const { data: shoes, error: shoesError } = await supabase
      .from("Shoes")
      .select("*")
      .eq("published_by", sellerId);

    if (shoesError) throw shoesError;

    // Get sold shoes count
    const { count: soldCount, error: soldError } = await supabase
      .from("Shoes")
      .select("*", { count: "exact" })
      .eq("published_by", sellerId)
      .eq("status", "SOLD");

    if (soldError) throw soldError;

    // Calculate total
    const totalListedShoes = shoes?.length || 0;
    const totalSoldShoes = soldCount || 0;

    return {
      listedShoes: totalListedShoes,
      soldShoes: totalSoldShoes,
    };
  } catch (error) {
    console.error("Error getting seller stats:", error);
    return {
      listedShoes: 0,
      soldShoes: 0,
    };
  }
}

// Fetch a single sneaker by ID
export async function fetchSneaker(shoeId: string) {
  const { data, error } = await supabase
    .from("Shoes")
    .select("*")
    .eq("shoe_id", shoeId)
    .single();

  if (error) throw error;
  return data;
}

// Update a sneaker with optional image update
export async function updateSneaker(
  shoeId: string,
  updates: any,
  imageFile?: File
) {
  try {
    let imageUrl = updates.image_url;

    // If there's a new image, upload it
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `shoes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      imageUrl = publicUrl;
    }

    const { data, error } = await supabase
      .from("Shoes")
      .update({ ...updates, image_url: imageUrl })
      .eq("shoe_id", shoeId)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error("Error updating sneaker:", error);
    return { error: "Failed to update sneaker" };
  }
}
