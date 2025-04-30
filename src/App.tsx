import { Routes, Route, BrowserRouter } from "react-router-dom";

import Login from "./pages/login";
import Home from "./pages/home";
import Signup from "./pages/signup";
import Marketplace from "./pages/marketplace";
import Customer from "./pages/customer";
import PublishSneaker from "./pages/publish-sneaker";
import ShoeList from "./pages/shoe-list";
import ShoeDetails from "./pages/shoe-details";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/messages" element={<Customer />} />
        <Route path="/publish-sneaker" element={<PublishSneaker />} />
        <Route path="/shoe-list" element={<ShoeList />} />
        <Route path="/shoe/:id" element={<ShoeDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
