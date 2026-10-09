import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mechanic' },
  serviceDetails: {
    serviceType: { type: String, required: true },
    basePrice: { type: Number, required: true },
    gst: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true }
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true }
  },
  status: { 
    type: String, 
    enum: ['IDLE', 'PENDING', 'VERIFYING', 'PAID', 'FAILED', 'CONFIRMED', 'MECHANIC_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'EXPIRED'], 
    default: 'PENDING' 
  },
  expiresAt: { type: Date },
}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);
