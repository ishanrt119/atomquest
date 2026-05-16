import { Notification } from "@/models/Notification";
import mongoose from "mongoose";

interface NotificationParams {
  recipientId: string | mongoose.Types.ObjectId;
  senderId?: string | mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  link?: string;
}

export async function createNotification(params: NotificationParams) {
  try {
    return await Notification.create(params);
  } catch (error) {
    console.error("[NotificationService] Failed to create notification:", error);
  }
}

export async function createBulkNotifications(paramsArray: NotificationParams[]) {
  try {
    return await Notification.insertMany(paramsArray);
  } catch (error) {
    console.error("[NotificationService] Failed to create bulk notifications:", error);
  }
}
