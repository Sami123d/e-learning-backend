import mongoose, { model } from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    role: {
      type: String,
      default: "Student",
    },
  },
  { timestamps: true }
);

export default model("User", UserSchema);
