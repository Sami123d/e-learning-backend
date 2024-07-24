import mongoose, { model } from "mongoose";
import Course from "./Course.js";

// Define the schema for course enrollment
const courseEnrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courses: [
      {
        course: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
        }],
        enrollmentDate: {
          type: Date,
          default: Date.now,
        },
        progress: {
          type: Number, // e.g., percentage of completion
          default: 0,
        },
        status: {
          type: String,
          enum: ["Active", "Completed", "Dropped"],
          default: "Active",
        },
      },
    ],
  },
  { timestamps: true }
);

export default model("CourseEnrollment", courseEnrollmentSchema);
