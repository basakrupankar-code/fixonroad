import mongoose from 'mongoose';

const mechanicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String },
  role: { type: String, default: 'mechanic' },
  workshopName: { type: String },
  serviceCategories: { type: [String], default: [] },
  vehiclePlate: { type: String },
  upiId: { type: String },
  isAvailable: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  currentLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  }
}, { timestamps: true });

export const Mechanic = mongoose.model('Mechanic', mechanicSchema);
