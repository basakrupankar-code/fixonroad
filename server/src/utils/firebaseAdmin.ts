import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
dotenv.config();

if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'fixonroad-dev',
    ...(process.env.FIREBASE_CLIENT_EMAIL && privateKey && {
      credential: require('firebase-admin/app').cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    })
  });
}

export const adminAuth = getAuth(getApp());
