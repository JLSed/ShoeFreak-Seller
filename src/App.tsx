import { Routes, Route, BrowserRouter } from "react-router-dom";
import {
  AuthProvider,
  RequireAuth,
  PublicRoute,
} from "./components/AuthProvider";

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes - accessible when not logged in */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route path="/account-verify" element={<AccountVerifiedPage />} />

          {/* Protected routes - require authentication & seller status */}
          <Route
            path="/home"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/marketplace"
            element={
              <RequireAuth>
                <Marketplace />
              </RequireAuth>
            }
          />
          <Route
            path="/messages"
            element={
              <RequireAuth>
                <Customer />
              </RequireAuth>
            }
          />
          <Route
            path="/publish-sneaker"
            element={
              <RequireAuth>
                <PublishSneaker />
              </RequireAuth>
            }
          />
          <Route
            path="/shoe-list"
            element={
              <RequireAuth>
                <ShoeList />
              </RequireAuth>
            }
          />
          <Route
            path="/shoe/:id"
            element={
              <RequireAuth>
                <ShoeDetails />
              </RequireAuth>
            }
          />
          <Route
            path="/order/:id"
            element={
              <RequireAuth>
                <OrderDetails />
              </RequireAuth>
            }
          />

          {/* Catch-all route for 404 errors */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
