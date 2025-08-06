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
  apiKey: "AIzaSyDaj2S1n-N_UoWJQRe2lL4y0MH3TClpKOQ",
  authDomain: "soultalk-9593e.firebaseapp.com",
  projectId: "soultalk-9593e",
  storageBucket: "soultalk-9593e.appspot.com",
  messagingSenderId: "448686836510",
  appId: "1:448686836510:web:25287b37a04b547e8c570f",
  measurementId: "G-3N62YCJ5WH"
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
