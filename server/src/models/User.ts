import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  
  // Optional for Google Auth
  phone: { type: String, sparse: true, unique: true },
  username: { type: String, sparse: true, unique: true },
  age: { type: Number },
  city: { type: String },
  language: { type: String, default: 'en' },
  password: { type: String }, // Optional for Google Auth, required for Email/Password
  
  acceptedCookies: { type: Boolean, required: true, default: false },
  isEmailVerified: { type: Boolean, required: true, default: false },
  role: { type: String, enum: ['customer', 'mechanic'], required: true },
  
  // 2FA Fields
  twoFactorSecret: { type: String },
  isTwoFactorEnabled: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
