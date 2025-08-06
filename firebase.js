import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: " ",
  authDomain: " ",
  projectId: " ",
  storageBucket: " ",
  messagingSenderId: " ",
  appId: " ",
  measurementId: " "
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ✅ Set up auth & Google provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ Set session persistence (only lasts until tab is closed or app is stopped)
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Session persistence set.");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

// ✅ Export so it can be used in other files
export { auth, provider };

