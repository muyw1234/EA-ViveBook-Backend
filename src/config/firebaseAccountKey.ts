// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAFB9g4-Sn0b93oYoTpc_HaGLcCV-fgK4w',
  authDomain: 'ea-vivebook-frontend-web.firebaseapp.com',
  projectId: 'ea-vivebook-frontend-web',
  storageBucket: 'ea-vivebook-frontend-web.firebasestorage.app',
  messagingSenderId: '870483568720',
  appId: '1:870483568720:web:dd4452b22e2c47ae82c955',
  measurementId: 'G-DNXTF3D8MB',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
