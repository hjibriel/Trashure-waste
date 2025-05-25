import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import LoadingPage from "./components/loading";

const ProtectedRoute = () => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
   
    return <LoadingPage />;
  }

  if (isSignedIn) {
    
    return <Outlet />;
  }

 
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
