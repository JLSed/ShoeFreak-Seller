import { useNavigate } from "react-router-dom";
import Header from "../components/header";

function Login() {
  const navigate = useNavigate();
  const handleLogin = async () => {
    navigate("/home"); // Redirect to home page after login
  };
  return (
    <div className="font-poppins h-screen p-2 bg-gray-200">
      <Header />
      <div className="p-12 shadow-md max-w-96 bg-white rounded-lg">
        <p className=" text-sm text-gray-500 mb-2">Login</p>
        <p className="font-monstserrat text-green-600 font-medium text-3xl">
          Your Trusted Shoe Marketplace
        </p>
        <div className="w-full min-h-[2px] bg-gray-200 my-12"></div>
        <form action="" className="flex flex-col">
          <label htmlFor="email">Email</label>
          <input type="text" placeholder="Email" className="mb-6" />
          <label htmlFor="password">Password</label>
          <input type="password" placeholder="Password" className="" />
          <button onClick={handleLogin}>go to home</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
