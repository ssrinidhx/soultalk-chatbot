import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';

const GoogleLoginButton = ({ onLogin }) => {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      onLogin(user); // Send user to parent
    } catch (error) {
      console.error("Google Login Error:", error.message);
    }
  };

  return (
    <button onClick={handleGoogleLogin}>
      Sign in 
    </button>
  );
};

export default GoogleLoginButton;
