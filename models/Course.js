// models/Course.js
import mongoose, { model } from "mongoose";

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  pdf: { type: String },
  video: { type: String },
});

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  thumbnail: { type: String, required: true }, // Add thumbnail field
  lectures: [lectureSchema], // Array of lectures for the course
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Reference to User model
},
{ timestamps: true });

export default model("Course", courseSchema);
