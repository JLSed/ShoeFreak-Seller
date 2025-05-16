import { Routes, Route, BrowserRouter } from "react-router-dom";

import Login from "./pages/login";
import Home from "./pages/home";
import Signup from "./pages/signup";
import Marketplace from "./pages/marketplace";
import Customer from "./pages/customer";
import PublishSneaker from "./pages/publish-sneaker";
import ShoeList from "./pages/shoe-list";
import ShoeDetails from "./pages/shoe-details";
import OrderDetails from "./pages/order-details";
import AccountVerifiedPage from "./pages/account-verified-page";
import NotFound from "./pages/not-found";
import AuthProvider from "./components/AuthProvider";
import SocialMedia from "./pages/socialmedia";
import Profile from "./pages/profile";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/account-verify" element={<AccountVerifiedPage />} />

          <Route path="/home" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/messages" element={<Customer />} />
          <Route path="/publish-sneaker" element={<PublishSneaker />} />
          <Route path="/shoe-list" element={<ShoeList />} />
          <Route path="/shoe/:id" element={<ShoeDetails />} />
          <Route path="/order/:id" element={<OrderDetails />} />
          <Route path="/socialmedia" element={<SocialMedia />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
