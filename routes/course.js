import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import Course from "../models/Course.js";
import cloudinary from "../cloudinary.js";
import fs from "fs";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

const Router = express.Router();

// Add a new course
Router.post(
  "/addcourse",
  upload.single("courseThumbnail"),
  async (req, res) => {
    try {
      let thumbnailUrl = null;
      const { courseName, courseDescription, lectures } = req.body;
      const courseThumbnail = req.file;

      if (courseThumbnail) {
        // Read the file buffer and convert it to a base64 data URL
        const base64Data = `data:${
          courseThumbnail.mimetype
        };base64,${courseThumbnail.buffer.toString("base64")}`;

        // Upload thumbnail to Cloudinary
        const response = await cloudinary.uploader.upload(base64Data, {
          resource_type: "auto",
          folder: "course_thumbnails",
        });
        thumbnailUrl = response.secure_url;
      }

      // Save course details to MongoDB
      const newCourse = new Course({
        name: courseName,
        description: courseDescription,
        thumbnail: thumbnailUrl,
        lectures: JSON.parse(lectures),
      });

      await newCourse.save();

      res.status(201).json({
        message: "Course added successfully",
        course: newCourse,
      });
    } catch (error) {
      console.error("Error adding course", error);
      res.status(500).json({ message: "Error adding course", error });
    }
  }
);

// Additional routes (get, update, delete) can be added here
Router.get("/getcourses", async (req, res) => {
  try {
    const courses = await Course.find(); // Fetch all courses from the database
    res.status(200).json(courses); // Return the courses as JSON
  } catch (error) {
    res.status(500).json({ message: "Error retrieving courses", error });
  }
});

Router.get("/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params; // Get courseId from the request parameters
    const course = await Course.findById(courseId); // Find the course by ID

    if (!course) {
      return res.status(404).json({ message: "Course not found" }); // Handle case where course is not found
    }

    res.status(200).json(course); // Return the course details
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ message: "Error fetching course", error }); // Handle any server errors
  }
});

Router.delete("/deletecourse/:id", async (req, res) => {
  const { id } = req.params; // Get the course ID from the request parameters

  try {
    const deletedCourse = await Course.findByIdAndDelete(id); // Find and delete the course

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res
      .status(200)
      .json({ message: "Course deleted successfully", course: deletedCourse });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error });
  }
});

Router.post(
  "/:courseId/addlecture",
  upload.fields([{ name: "pdf" }, { name: "video" }]),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title, description } = req.body;
      let pdfUrl = null;
      let videoUrl = null;

      // Handle PDF file upload
      if (req.files.pdf) {
        const pdfFile = req.files.pdf[0].buffer;
        const base64Pdf = `data:application/pdf;base64,${pdfFile.toString(
          "base64"
        )}`;
        const pdfUploadResponse = await cloudinary.uploader.upload(base64Pdf, {
          resource_type: "auto",
          folder: "course_lectures/pdfs",
        });
        pdfUrl = pdfUploadResponse.secure_url;
      }

      // Handle video file upload
      if (req.files.video) {
        const videoFile = req.files.video[0].buffer;
        const base64Video = `data:video/mp4;base64,${videoFile.toString(
          "base64"
        )}`;
        const videoUploadResponse = await cloudinary.uploader.upload(
          base64Video,
          {
            resource_type: "video",
            folder: "course_lectures/videos",
          }
        );
        videoUrl = videoUploadResponse.secure_url;
      }

      // Update course in MongoDB with new lecture details
      const course = await Course.findByIdAndUpdate(
        courseId,
        {
          $push: {
            lectures: {
              title,
              description,
              pdf: pdfUrl,
              video: videoUrl,
            },
          },
        },
        { new: true }
      );

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.status(201).json({
        message: "Lecture added successfully",
        lecture: course.lectures[course.lectures.length - 1],
      });
    } catch (error) {
      console.error("Error adding lecture:", error);
      res.status(500).json({ message: "Error adding lecture", error });
    }
  }
);
Router.delete("/:courseId/deletelecture/:lectureId", async (req, res) => {
  const { courseId, lectureId } = req.params;

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture._id.toString() === lectureId
    );

    if (lectureIndex === -1) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    // Remove the lecture from the course
    course.lectures.splice(lectureIndex, 1);
    await course.save();

    res.status(200).json({ message: "Lecture deleted successfully" });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    res.status(500).json({ message: "Error deleting lecture", error });
  }
});

export default Router;
