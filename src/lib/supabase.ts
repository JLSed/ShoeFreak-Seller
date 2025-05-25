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
  try {
    // First check if email already exists in the Users table
    const { data: existingUsers, error: checkError } = await supabase
      .from("Users")
      .select("email")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is what we want
      console.error("Error checking existing user:", checkError);
      throw new Error("Error checking existing user");
    }

    // If user exists, throw an error
    if (existingUsers) {
      throw new Error(
        "Email already registered. Please use a different email or login instead."
      );
    }

    // If email doesn't exist, proceed with signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) throw error;

    // After successful auth signup, insert user info into Users table
    const { error: userError } = await supabase.from("Users").insert([
      {
        user_id: data.user!.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        address: address,
        contact_number: contactNumber,
      },
    ]);

    if (userError) {
      // If there was an error inserting into Users table,
      // we should ideally clean up the auth user that was created
      console.error("Error creating user profile:", userError);
      throw userError;
    }

    return { response: data };
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
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
    .eq("status", "AVAILABLE")
    .order("created_at", { ascending: false });

  if (error) throw error;
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

// Fetch customers who have messaged the current seller
export async function fetchCustomersWithChat(sellerId: string) {
  // First get all unique customer IDs from messages
  const { data: messageData, error: messageError } = await supabase
    .from("messages")
    .select("customer_id")
    .eq("seller_id", sellerId);

  if (messageError) throw messageError;

  const customerIds = messageData.map((msg) => msg.customer_id);

  if (customerIds.length === 0) return [];

  // Then fetch customer details
  const { data: customers, error: customerError } = await supabase
    .from("Users")
    .select("user_id, first_name, last_name, email")
    .in("user_id", customerIds)
    .eq("type", "CUSTOMER");

  if (customerError) throw customerError;

  return customers;
}

// Fetch messages between a seller and a customer
export async function fetchMessages(sellerId: string, customerId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

// Send a message from a seller to a customer
export async function sendMessage(
  sellerId: string,
  customerId: string,
  message: string,
  sender: "SELLER" | "CUSTOMER"
) {
  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        seller_id: sellerId,
        customer_id: customerId,
        message,
        sender,
      },
    ])
    .select()
    .single();

  if (error) return { error };
  return { data };
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
  materials: {
    leather: boolean;
    synthetic: boolean;
    rubberFoam: boolean;
    ecoFriendly: boolean;
    other: boolean;
  };
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
  materials,
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
          material: materials,
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

interface SaleItem {
  shoe: {
    price: number;
    published_by: string;
  };
}

// Get seller's sales statistics
export async function getSellerSalesStats(sellerId: string) {
  try {
    // Get today's start and end timestamps
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get month's start and end timestamps
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // Fetch today's sales with type
    const { data: todaySales, error: todayError } = await supabase
      .from("checkouts")
      .select(
        `
        *,
        shoe:Shoes!inner(
          price,
          published_by
        )
      `
      )
      .eq("status", "SENDING")
      .eq("shoe.published_by", sellerId)
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    if (todayError) throw todayError;

    // Fetch month's sales with type
    const { data: monthSales, error: monthError } = await supabase
      .from("checkouts")
      .select(
        `
        *,
        shoe:Shoes!inner(
          price,
          published_by
        )
      `
      )
      .eq("status", "SENDING")
      .eq("shoe.published_by", sellerId)
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString());

    if (monthError) throw monthError;

    // Calculate totals with proper typing
    const todayTotal =
      todaySales?.reduce(
        (sum, item: SaleItem) => sum + (item.shoe.price || 0),
        0
      ) || 0;
    const monthTotal =
      monthSales?.reduce(
        (sum, item: SaleItem) => sum + (item.shoe.price || 0),
        0
      ) || 0;

    return {
      todaySales: todayTotal,
      monthSales: monthTotal,
    };
  } catch (error) {
    console.error("Error getting sales stats:", error);
    return {
      todaySales: 0,
      monthSales: 0,
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

// Fetch pending orders for the current seller
export async function fetchPendingOrders(sellerId: string) {
  const { data, error } = await supabase
    .from("checkouts")
    .select(
      `
      *,
      shoe:Shoes!inner(
        shoe_id,
        shoe_name,
        brand,
        color,
        size,
        price,
        image_url,
        published_by
      ),
      buyer:Users!buyer_id(
        user_id,
        first_name,
        last_name,
        email
      )
    `
    )
    .eq("status", "PENDING")
    .eq("shoe.published_by", sellerId);

  if (error) throw error;
  console.log(data);
  return data || [];
}

export async function fetchOrder(orderId: string) {
  const { data, error } = await supabase
    .from("checkouts")
    .select(
      `
      *,
      shoe:Shoes!inner(
        shoe_id,
        shoe_name,
        brand,
        color,
        size,
        price,
        image_url,
        published_by
      ),
      buyer:Users!buyer_id(
        user_id,
        first_name,
        last_name,
        email,
        contact_number,
        address
      )
    `
    )
    .eq("checkout_id", orderId)
    .single();

  if (error) throw error;
  return data;
}

// Complete an order
export async function completeOrder(orderId: string, shoeId: string) {
  try {
    // Start a transaction to update both tables
    const { data: checkoutData, error: checkoutError } = await supabase
      .from("checkouts")
      .update({ status: "SENDING" })
      .eq("checkout_id", orderId)
      .select()
      .single();

    if (checkoutError) throw checkoutError;

    const { data: shoeData, error: shoeError } = await supabase
      .from("Shoes")
      .update({ status: "SOLD" })
      .eq("shoe_id", shoeId)
      .select()
      .single();

    if (shoeError) throw shoeError;

    return { checkoutData, shoeData };
  } catch (error) {
    console.error("Error completing order:", error);
    return { error: "Failed to complete order" };
  }
}

// Cancel an order
export async function cancelOrder(orderId: string) {
  try {
    const { data, error } = await supabase
      .from("checkouts")
      .update({ status: "CANCELLED" })
      .eq("checkout_id", orderId)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return { error: "Failed to cancel order" };
  }
}

// Fetch all posts with user info and comment counts
export async function fetchPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      user:user_id (*),
      comments:comments(count),
      post_likes:post_likes(count)
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Transform the data to make likes_count a simple number
  const transformedData = data?.map((post) => ({
    ...post,
    likes_count: post.post_likes?.[0]?.count || 0,
    comments_count: post.comments?.[0]?.count || 0,
  }));
  console.log(transformedData);

  return transformedData || [];
}

// Create a new post
export async function createPost(
  userId: string,
  content: string,
  imageFile?: File
) {
  try {
    let imageUrl = null;

    // Upload image if provided
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `social_media/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      imageUrl = publicUrl;
    }

    // Insert post into database
    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          user_id: userId,
          content,
          image_url: imageUrl,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error("Error creating post:", error);
    return { error: "Failed to create post" };
  }
}

// Add a comment to a post
export async function addComment(
  postId: string,
  userId: string,
  content: string
) {
  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        post_id: postId,
        user_id: userId,
        content,
      },
    ])
    .select();

  if (error) throw error;
  return data;
}

// Fetch comments for a post
export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      user:user_id (
        user_id,
        first_name,
        last_name,
        email
      )
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export const likePost = async (postId: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("User not authenticated");
  }

  const userId = user.user.id;

  // Check if the user already liked this post
  const { data: existingLike } = await supabase
    .from("post_likes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  // If already liked, don't do anything
  if (existingLike) {
    return; // Or remove the like to toggle
  }

  // Add the like to post_likes table
  const { error } = await supabase
    .from("post_likes")
    .insert([{ post_id: postId, user_id: userId }]);

  if (error) throw error;
};

export const getPostLikesCount = async (postId: string) => {
  const { count, error } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  console.log("count", count);
  if (error) throw error;
  return count || 0;
};

export const hasUserLikedPost = async (postId: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  const { data, error } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.user.id)
    .maybeSingle();

  if (error) throw error;
  return !!data;
};

export const unlikePost = async (postId: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("User not authenticated");
  }

  const userId = user.user.id;

  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) throw error;
};

// Fetch user profile
export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
};

// Update user profile
export const updateUserProfile = async (profile: any) => {
  const { error } = await supabase
    .from("Users") // Make sure this matches your actual table name
    .update({
      first_name: profile.first_name,
      last_name: profile.last_name,
      photo_url: profile.photo_url, // Changed from avatar_url to photo_url
      location: profile.location,
      phone: profile.phone,
    })
    .eq("user_id", profile.user_id); // Make sure this matches your primary key column name

  if (error) throw error;
  return true;
};

// Upload profile image
export const uploadProfileImage = async (userId: string, file: File) => {
  // Create a unique file name
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}_profile_${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;
  const filePath = `profile_images/${fileName}`;

  // Upload the file
  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Get the public URL
  const { data } = supabase.storage.from("images").getPublicUrl(filePath);

  return data.publicUrl; // This will be assigned to photo_url
};

// Delete post
export const deletePost = async (postId: string) => {
  // First remove any associated likes
  await supabase.from("post_likes").delete().eq("post_id", postId);

  // Then remove any comments
  await supabase.from("comments").delete().eq("post_id", postId);

  // Finally delete the post
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) throw error;
  return true;
};

/**
 * Fetches all posts created by a specific user
 * @param userId - The ID of the user whose posts should be fetched
 * @returns An array of the user's posts with like and comment counts
 */
export const fetchUserPosts = async (userId: string) => {
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      post_likes(count),
      comments(count)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user posts:", error);
    throw error;
  }

  // Transform data to get counts from nested structures
  const transformedData = data.map((post) => ({
    ...post,
    likes_count: post.post_likes?.[0]?.count || 0,
    comments_count: post.comments?.[0]?.count || 0,
  }));

  return transformedData;
};

// Add this to your src/lib/supabase.ts file
export async function createNotification(
  content: string,
  notifiedBy: string,
  notifiedFor: string,
  shoeReference: string
) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          content,
          notified_by: notifiedBy,
          notified_for: notifiedFor,
          shoe_reference: shoeReference,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { error };
  }
}

export async function recordSale(
  shoeId: string,
  sellerId: string,
  buyerId: string,
  salePrice: number
) {
  try {
    const { data, error } = await supabase
      .from("seller_sales")
      .insert([
        {
          shoe_id: shoeId,
          seller_id: sellerId,
          buyer_id: buyerId,
          sale_price: salePrice,
        },
      ])
      .select();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error("Error recording sale:", error);
    return { error };
  }
}

export async function getSellerProductAnalytics(sellerId: string) {
  try {
    // Get sales count for each shoe
    const { data: salesData, error: salesError } = await supabase
      .from("seller_sales")
      .select("shoe_id, sale_price")
      .eq("seller_id", sellerId);

    if (salesError) throw salesError;

    if (!salesData || salesData.length === 0) {
      return {
        bestSellers: [],
        leastSellers: [],
      };
    }

    // Count sales per shoe
    const salesCount: Record<string, { count: number; total: number }> = {};

    salesData.forEach((sale) => {
      if (!salesCount[sale.shoe_id]) {
        salesCount[sale.shoe_id] = { count: 0, total: 0 };
      }
      salesCount[sale.shoe_id].count += 1;
      salesCount[sale.shoe_id].total += parseFloat(sale.sale_price);
    });

    // Get shoe details for all sold shoes
    const shoeIds = Object.keys(salesCount);

    if (shoeIds.length === 0) {
      return {
        bestSellers: [],
        leastSellers: [],
      };
    }

    const { data: shoeDetails, error: shoeError } = await supabase
      .from("Shoes")
      .select("shoe_id, shoe_name, brand, image_url, price")
      .in("shoe_id", shoeIds);

    if (shoeError) throw shoeError;

    if (!shoeDetails) {
      return {
        bestSellers: [],
        leastSellers: [],
      };
    }

    // Combine shoe details with sales data
    const combinedData = shoeDetails.map((shoe) => ({
      ...shoe,
      salesCount: salesCount[shoe.shoe_id].count,
      totalRevenue: salesCount[shoe.shoe_id].total,
    }));

    // Sort by sales count
    const sortedBySales = [...combinedData].sort(
      (a, b) => b.salesCount - a.salesCount
    );

    // Get top 5 best sellers and bottom 5 least sellers
    const bestSellers = sortedBySales.slice(0, 5);
    const leastSellers = [...sortedBySales]
      .sort((a, b) => a.salesCount - b.salesCount)
      .slice(0, 5);

    return {
      bestSellers,
      leastSellers,
    };
  } catch (error) {
    console.error("Error fetching product analytics:", error);
    return {
      bestSellers: [],
      leastSellers: [],
    };
  }
}

/**
 * Fetches loyal customers data for a seller
 */
export async function getSellerCustomerAnalytics(sellerId: string) {
  try {
    // Get all sales with customer info
    const { data: salesData, error: salesError } = await supabase
      .from("seller_sales")
      .select("buyer_id, sale_price")
      .eq("seller_id", sellerId);

    if (salesError) throw salesError;

    if (!salesData || salesData.length === 0) {
      return { loyalCustomers: [] };
    }

    // Count purchases per customer
    const customerPurchases: Record<string, { count: number; total: number }> =
      {};

    salesData.forEach((sale) => {
      if (!customerPurchases[sale.buyer_id]) {
        customerPurchases[sale.buyer_id] = { count: 0, total: 0 };
      }
      customerPurchases[sale.buyer_id].count += 1;
      customerPurchases[sale.buyer_id].total += parseFloat(sale.sale_price);
    });

    // Get customer details
    const customerIds = Object.keys(customerPurchases);

    if (customerIds.length === 0) {
      return { loyalCustomers: [] };
    }

    const { data: customerDetails, error: customerError } = await supabase
      .from("Users")
      .select("user_id, first_name, last_name, email, photo_url")
      .in("user_id", customerIds);

    if (customerError) throw customerError;

    if (!customerDetails) {
      return { loyalCustomers: [] };
    }

    // Combine customer details with purchase data
    const combinedData = customerDetails.map((customer) => ({
      ...customer,
      purchaseCount: customerPurchases[customer.user_id].count,
      totalSpent: customerPurchases[customer.user_id].total,
    }));

    // Sort by purchase count to get loyal customers
    const loyalCustomers = combinedData
      .sort((a, b) => b.purchaseCount - a.purchaseCount)
      .slice(0, 5);

    return { loyalCustomers };
  } catch (error) {
    console.error("Error fetching customer analytics:", error);
    return { loyalCustomers: [] };
  }
}
