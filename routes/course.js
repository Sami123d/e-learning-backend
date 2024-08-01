import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import Course from "../models/Course.js";
import User from "../models/User.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Notification from "../models/Notification.js";
import cloudinary from "../cloudinary.js";
import dotenv from "dotenv";
dotenv.config();

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
      const { courseName, courseDescription, lectures, coursePrice } = req.body;
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
        price: coursePrice, // Add the price to the new course
      });

      await newCourse.save();

      await newCourse.save();

      // Create a new notification
      const notificationMessage = `New course added: ${courseName}`;
      const newNotification = new Notification({
        message: notificationMessage,
      });

      await newNotification.save();

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
  const { id } = req.params;

  try {
    // Find and delete the course
    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Remove the course from all enrollments
    await CourseEnrollment.updateMany(
      { "courses.course": id },
      { $pull: { courses: { course: id } } }
    );

    console.log(deletedCourse.name);

    // Create a new notification
    const notification = new Notification({
      message: `Course "${deletedCourse.name}" has been deleted.`,
    });

    await notification.save();

    res
      .status(200)
      .json({ message: "Course deleted successfully", course: deletedCourse });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error });
  }
});

Router.post(
  "/:courseId/addlecture",
  upload.fields([{ name: "videoFile" }]),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title, description, videoType, videoLink } = req.body;
      let finalVideoLink = videoLink;

      // Handle video file upload if the video type is file
      if (videoType === "file" && req.files.videoFile) {
        const videoFile = req.files.videoFile[0].buffer;
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
        finalVideoLink = videoUploadResponse.secure_url;
      }

      const lecture = {
        title,
        description,
        videoType,
        videoLink: finalVideoLink, // Save the final video link
      };

      // Update course in MongoDB with new lecture details
      const course = await Course.findByIdAndUpdate(
        courseId,
        { $push: { lectures: lecture } },
        { new: true }
      );

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const notification = new Notification({
        message: `New Lecture ${title} added into ${course.name} Course `,
      });

      await notification.save();

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

    // Find the index of the lecture to delete
    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture._id.toString() === lectureId
    );

    if (lectureIndex === -1) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    const lectureName = course.lectures[lectureIndex].title; // Assuming lectures have a 'name' field

    // Remove the lecture from the course
    course.lectures.splice(lectureIndex, 1);
    await course.save();

    // Optionally update CourseEnrollment if needed
    // Example if lectures are tracked in CourseEnrollment
    await CourseEnrollment.updateMany(
      { "courses.course": courseId, "courses.lectures.lecture": lectureId },
      { $pull: { "courses.$.lectures": { lecture: lectureId } } }
    );

    const notificationMessage = `Lecture "${lectureName}" was deleted from the course "${course.name}"`;
    const newNotification = new Notification({
      message: notificationMessage,
    });

    await newNotification.save();

    res.status(200).json({ message: "Lecture deleted successfully" });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    res.status(500).json({ message: "Error deleting lecture", error });
  }
});

export default Router;
