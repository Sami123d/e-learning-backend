// models/Course.js
import mongoose, { model } from "mongoose";

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoLink: { type: String }, // Store video link (either direct or file link)
  videoType: { type: String }, // Add videoType to keep track
});

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  thumbnail: { type: String, required: true },
   price: { type: Number, required: true },  // Add thumbnail field
  lectures: [lectureSchema], // Array of lectures for the course
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Reference to User model
},
{ timestamps: true });

export default model("Course", courseSchema);
