import mongoose, { model } from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role:{
        type: String,
        default: "Student"
    }

  },
  { timestamps: true }
);

export default model("User", UserSchema);
