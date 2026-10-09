import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  role: 'customer' | 'mechanic';
  sessionToken: string;
  expiresAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, required: true },
  role: { type: String, enum: ['customer', 'mechanic'], required: true },
  sessionToken: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

export const Session = mongoose.model<ISession>('Session', sessionSchema);
