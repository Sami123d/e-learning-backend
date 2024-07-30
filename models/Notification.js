// models/notificationModel.js

import mongoose from "mongoose";
import { model } from "mongoose";

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default model("Notification", notificationSchema);
