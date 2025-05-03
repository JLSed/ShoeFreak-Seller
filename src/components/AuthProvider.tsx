import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  isAuthenticated: boolean;
  isSeller: boolean;
  isLoading: boolean;
  user: any | null;
  authCheckComplete: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isSeller: false,
  isLoading: true,
  user: null,
  authCheckComplete: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsSeller(false);
    setUser(null);
  };

  useEffect(() => {
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
            setIsSeller(true);
            setUser(sessionData.session.user);
          } else {
            // User is not a seller, sign them out
            console.log("Non-seller account detected, signing out");
            await signOut();
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
        // On error, ensure user is signed out
        await signOut();
      } finally {
        setIsLoading(false);
        setAuthCheckComplete(true);
      }
    };

    checkAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);

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
            setIsSeller(true);
            setUser(session.user);
          } else {
            // User is not a seller, sign them out
            console.log("Non-seller account detected, signing out");
            await signOut();
          }
        } else if (event === "SIGNED_OUT") {
          setIsAuthenticated(false);
          setIsSeller(false);
          setUser(null);
        }

        setIsLoading(false);
        setAuthCheckComplete(true);
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isSeller,
        isLoading,
        user,
        authCheckComplete,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Route guards
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // if (isLoading || !authCheckComplete) {
  //   // Show loading spinner while checking auth
  //   return (
  //     <div className="flex justify-center items-center min-h-screen bg-green-900">
  //       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
  //     </div>
  //   );
  // }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // No need to check for isSeller here, as non-sellers are automatically signed out

  return <>{children}</>;
}

// Public route (accessible only when NOT authenticated)
export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  //const { isAuthenticated, isLoading, authCheckComplete } = useAuth();

  // Only render loading state if still checking auth
  // if (isLoading || !authCheckComplete) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen bg-green-900">
  //       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
  //     </div>
  //   );
  // }

  // Only redirect if auth check is complete
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
