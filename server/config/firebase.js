const admin = require('firebase-admin');

// Initialize Firebase Admin
// Works with:
// 1. GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON
// 2. Application Default Credentials (gcloud auth application-default login)
// 3. Automatic credentials on Google Cloud (Cloud Run, App Engine, etc.)
const initializeFirebase = () => {
  if (admin.apps.length === 0) {
    try {
      // Try to initialize with service account if available
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase initialized with service account');
      } else {
        // Use Application Default Credentials
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'split-app-c83e4'
        });
        console.log('Firebase initialized with Application Default Credentials');
      }
    } catch (error) {
      console.error('Firebase initialization error:', error.message);
      // Initialize without credentials for local development (will use emulator or fail gracefully)
      admin.initializeApp({
        projectId: 'split-app-c83e4'
      });
    }
  }
  return admin;
};

const firebase = initializeFirebase();
const db = firebase.firestore();

module.exports = { firebase, db, admin };
