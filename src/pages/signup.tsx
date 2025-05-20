import { useNavigate } from "react-router-dom";
import { signUp } from "../lib/supabase";
import { useState } from "react";

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [contactNumberError, setContactNumberError] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const validateContactNumber = (number: string) => {
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (!number) return "Contact number is required";
    if (!phoneRegex.test(number))
      return "Please enter a valid phone number (e.g., 09123456789)";
    return "";
  };

  const handleContactNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setContactNumber(value);
    setContactNumberError(validateContactNumber(value));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password match
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Validate contact number
    const contactError = validateContactNumber(contactNumber);
    if (contactError) {
      setContactNumberError(contactError);
      return;
    }

    setLoading(true);
    try {
      const response = await signUp(
        password,
        firstName,
        address,
        lastName,
        email,
        contactNumber
      );

      if (response && response.response) {
        alert("Signup successful! Please log in.");
        // Redirect to login page
        navigate("/");
      }
    } catch (error: any) {
      // Display a specific error message
      if (error.message.includes("already registered")) {
        alert(error.message);
      } else {
        alert(error.message || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center font-poppins h-screen p-2 bg-gray-200">
      <div className=" p-12 shadow-md bg-white rounded-lg h-fit ">
        <p className=" text-sm text-gray-500 mb-2">Create Account</p>
        <p className="font-monstserrat text-green-600 font-medium text-3xl">
          Got Sneakers to Spare? Start Earning Now!
        </p>
        <div className="w-full min-h-[2px] bg-gray-200 my-12"></div>
        <form onSubmit={handleSignup} className="flex flex-col">
          <div className="grid grid-cols-2 gap-x-4">
            <label className="text-sm text-gray-600">First Name</label>
            <label className="text-sm text-gray-600">Last Name</label>
            <input
              type="text"
              placeholder="Ex. John"
              className="mb-6 border rounded-lg p-2"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Ex. Dela Cruz"
              className="mb-6 border rounded-lg p-2"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <label className="text-sm text-gray-600">Email</label>
            <label className="text-sm text-gray-600">Contact Number</label>
            <input
              type="text"
              placeholder="Ex. johndelacruz@gmail.com"
              className="mb-6 border rounded-lg p-2"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex flex-col">
              <input
                type="text"
                placeholder="Ex. 09123456789"
                className={`mb-1 border rounded-lg p-2 ${
                  contactNumberError ? "border-red-500" : ""
                }`}
                required
                value={contactNumber}
                onChange={handleContactNumberChange}
              />
              {contactNumberError && (
                <p className="text-red-500 text-xs mb-2">
                  {contactNumberError}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Address Location</label>
            <input
              type="text"
              placeholder="Ex. 729 Quirino Highway, San Bartolome, Quezon City, 1116 Metro Manila, Philippines"
              className="mb-6 border rounded-lg p-2"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <label className="text-sm text-gray-600" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              placeholder="Password"
              className="mb-6 border rounded-lg p-2"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label className="text-sm text-gray-600" htmlFor="confirm_password">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Password"
              className="mb-6 border rounded-lg p-2"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            className="bg-green-600 text-white py-4 rounded-lg"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4">
          ALready have an Account?{" "}
          <span
            onClick={() => navigate("/")}
            className="text-green-500 cursor-pointer"
          >
            Log In
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
