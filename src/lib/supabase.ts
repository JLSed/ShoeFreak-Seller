import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

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
  if (data) {
    if (!data.user?.id) {
      throw { response: false, message: "User ID is undefined" };
    }
    const { data: userData, response } = await registerUser(
      data.user?.id,
      firstName,
      address,
      lastName,
      email,
      contactNumber
    );
    if (response) return { response: false, message: response };
    if (userData) {
      return { response: true, auth_data: data, user_data: userData };
    }
  }
}

export async function registerUser(
  user_id: string,
  firstName: string,
  address: string,
  lastName: string,
  email: string,
  contactNumber: string
) {
  const { data, error } = await supabase.from("Users").insert([
    {
      user_id: user_id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      contact_number: contactNumber,
      address: address,
      type: "SELLER",
    },
  ]);
  if (error) {
    console.error("Error inserting user data:", error);
    throw { response: false, message: error.message };
  }
  return { response: true, data: data };
}
