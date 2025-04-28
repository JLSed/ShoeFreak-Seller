import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { signIn } from "../lib/supabase";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await signIn(email, password);
      if (response && response.response) {
        navigate("/home");
      } else {
        alert(response?.message || "Login failed");
      }
    } catch (error: any) {
      alert(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center font-poppins h-screen p-2 bg-gray-200">
      <div className=" p-12 shadow-md max-w-96 bg-white rounded-lg h-fit ">
        <p className=" text-sm text-gray-500 mb-2">Login</p>
        <div className="w-full min-h-[2px] bg-gray-200 my-12"></div>
        <form onSubmit={handleLogin} className="flex flex-col">
          <label className="text-sm text-gray-600" htmlFor="email">
            Email
          </label>
          <input
            type="text"
            placeholder="Email"
            className="mb-6 border rounded-lg p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="text-sm text-gray-600" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            placeholder="Password"
            className="mb-6 border rounded-lg p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-green-600 text-white py-4 rounded-lg"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4">
          Create an Account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-green-500 cursor-pointer"
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
