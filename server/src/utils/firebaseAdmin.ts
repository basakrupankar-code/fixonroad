import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
dotenv.config();

if (!getApps().length) {
  // We can initialize without credentials if we just want to verify ID tokens, 
  // but it's best to use default creds or project ID.
  // For verifyIdToken, just having a projectId is often enough.
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'fixonroad-dev'
  });
}

export const adminAuth = getAuth(getApp());
