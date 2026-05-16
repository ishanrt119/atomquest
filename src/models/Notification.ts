import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  message: string;
  type: "system" | "goal_update" | "review_request" | "checkin_reminder";
  read: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["system", "goal_update", "review_request", "checkin_reminder"], 
      required: true 
    },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

export const Notification = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
