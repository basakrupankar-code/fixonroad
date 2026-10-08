import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionToken: string;
  expiresAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionToken: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

export const Session = mongoose.model<ISession>('Session', sessionSchema);
