import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: "system" | "goal_update" | "review_request" | "checkin_reminder" | "goal_approved" | "goal_rejected" | "goal_submitted" | "shared_goal_assigned" | "admin_unlock" | "team_assignment";
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["system", "goal_update", "review_request", "checkin_reminder", "goal_approved", "goal_rejected", "goal_submitted", "shared_goal_assigned", "admin_unlock", "team_assignment"], 
      required: true 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'low' 
    },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

export const Notification = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
