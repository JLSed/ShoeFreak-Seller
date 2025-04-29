import { Routes, Route, BrowserRouter } from "react-router-dom";

import Login from "./pages/login";
import Home from "./pages/home";
import Signup from "./pages/signup";
import Marketplace from "./pages/marketplace";
import Customer from "./pages/customer";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/messages" element={<Customer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
