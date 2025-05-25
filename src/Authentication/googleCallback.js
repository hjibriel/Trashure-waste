import { useEffect } from 'react';
import { AuthenticateWithRedirectCallback, useUser } from "@clerk/clerk-react";


const Googlecallback = () => {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      if (user.firstName && user.lastName) {
        window.location.href = "http://localhost:3000/dashboard";
      }
    }
  }, [user]);
  
  return (
    <div >

      <AuthenticateWithRedirectCallback 
        signUpFallbackRedirectUrl="http://localhost:3000/dashboard"
        signInFallbackRedirectUrl="http://localhost:3000/dashboard"
        onError={(error) => {
          console.error("Authentication Error:", error);
        }}
      />
    </div>
  );
};

export default Googlecallback;