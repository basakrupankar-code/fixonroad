import mongoose from 'mongoose';

export interface ICartItem {
  id: string;
  name: string;
  nameKey?: string;
  type?: 'bike' | 'car';
  price: number;
  quantity?: number;
  eta?: string;
  note?: string;
  noteKey?: string;
  icon?: string;
  unit?: string;
}

export interface ICart extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  breakdownLocation?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  nameKey: { type: String },
  type: { type: String, enum: ['bike', 'car'] },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  eta: { type: String },
  note: { type: String },
  noteKey: { type: String },
  icon: { type: String },
  unit: { type: String },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: { type: [cartItemSchema], default: [] },
  breakdownLocation: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
  },
}, { timestamps: true });

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
