import Stripe from "stripe";
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import cors from "cors";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const Router = express.Router();
app.use(cors());

// To handle raw body data for Stripe webhook
app.use(bodyParser.raw({ type: "application/json" }));

// Router.post("/create-payment-intent", async (req, res) => {
//   const { userId, courseId } = req.body;

//   try {
//     const course = await Course.findById(courseId);
//     if (!course) {
//       return res.status(404).json({ message: "Course not found" });
//     }

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: course.price * 100,
//       currency: "usd",
//       metadata: { userId, courseId },
//     });

//     res.status(200).json({ clientSecret: paymentIntent.client_secret });
//   } catch (error) {
//     console.error("Error creating Payment Intent:", error);
//     res.status(500).json({ message: "Error creating Payment Intent" });
//   }
// });

Router.post("/create-payment-intent", async (req, res) => {
  const { userId, courseId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // Replace with the actual amount
      currency: "usd",
      payment_method_types: ["card"], // Only allow card payments
      metadata: { userId, courseId },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send("Internal Server Error");
  }
});

Router.post("/pay", async (req, res) => {
  const { paymentIntentId, userId, courseId } = req.body;

  try {
    // Retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Payment was successful, handle enrollment here

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      let enrollment = await CourseEnrollment.findOne({ user: userId });

      if (enrollment) {
        const alreadyEnrolled = enrollment.courses.some(
          (enrolledCourse) => enrolledCourse.course.toString() === courseId
        );

        if (alreadyEnrolled) {
          return res
            .status(400)
            .json({ message: "User already enrolled in this course" });
        }

        enrollment.courses.push({ course: courseId });
        await enrollment.save();
      } else {
        enrollment = new CourseEnrollment({
          user: userId,
          courses: [{ course: courseId }],
        });
        await enrollment.save();
      }

      res.status(200).json({ success: true });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Payment not successful" });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Error processing payment" });
  }
});

Router.get("/:userId/enrolled-courses", async (req, res) => {
  const { userId } = req.params;

  try {
    console.log(`Fetching enrolled courses for userId: ${userId}`);
    // Find the enrollment record for the user
    const enrollment = await CourseEnrollment.findOne({
      user: userId,
    }).populate({
      path: "courses.course", // Populate the 'course' field in the 'courses' array
      model: "Course",
    });

    console.log("Enrollment record:", enrollment);

    if (!enrollment) {
      return res
        .status(404)
        .json({ message: "No courses found for this user." });
    }

    // Respond with the enrolled courses and their details
    res.status(200).json(enrollment.courses);
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

Router.put("/updateprogress/:userId/:courseId", async (req, res) => {
  const { userId, courseId } = req.params;
  const { progress } = req.body;

  try {
    // Find the enrollment document for the given user and course
    const enrollment = await CourseEnrollment.findOneAndUpdate(
      { user: userId, "courses.course": courseId },
      { $set: { "courses.$.progress": progress } },
      { new: true } // Return the updated document
    );

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    res.status(200).json(enrollment);
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default Router;
