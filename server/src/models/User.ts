import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String },
  role: { type: String, default: 'customer' },
  savedLocations: { type: [String], default: [] },
  activeOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
