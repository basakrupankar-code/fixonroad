import mongoose from 'mongoose';

const mechanicSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  garageName: { type: String, default: null },
  isOnline: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  locationUpdatedAt: { type: Date },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, { timestamps: true });

mechanicSchema.index({ location: '2dsphere' });

export const Mechanic = mongoose.model('Mechanic', mechanicSchema);
