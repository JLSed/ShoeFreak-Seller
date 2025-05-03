import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

// Simplified AuthContext with only essential properties
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication once when component mounts
    const checkAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData.session) {
          // Check if user is a seller
          const { data: userData, error } = await supabase
            .from("Users")
            .select("type")
            .eq("user_id", sessionData.session.user.id)
            .single();

          if (!error && userData && userData.type === "SELLER") {
            // User is a seller, set authenticated
            setIsAuthenticated(true);
          } else {
            // User is not a seller, sign them out
            console.log("Non-seller account detected, signing out");
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // Check if user is a seller
          const { data: userData, error } = await supabase
            .from("Users")
            .select("type")
            .eq("user_id", session.user.id)
            .single();

          if (!error && userData && userData.type === "SELLER") {
            // User is a seller, set authenticated
            setIsAuthenticated(true);
          } else {
            // User is not a seller, sign them out
            console.log("Non-seller account detected, signing out");
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          }
        } else if (event === "SIGNED_OUT") {
          setIsAuthenticated(false);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Route guards
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-green-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // User is authenticated and a seller
  return <>{children}</>;
}

// Public route (accessible only when NOT authenticated)
export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-green-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // User is not authenticated
  return <>{children}</>;
}
