import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import morgan from "morgan";
import userRoute from "./routes/users.js";
import authRoute from "./routes/auth.js";
import courseRoutes from "./routes/course.js";
import enrollRoutes from "./routes/course_enroll.js";
import cors from 'cors';
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(morgan("common"));
app.use (helmet());
app.use(cors());

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/courses", courseRoutes);
app.use("/api/enroll",enrollRoutes)

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
    // code that relies on the MongoDB connection here
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.get("/", (req, res)=>{
    res.send("welcome")
})

app.listen(port, ()=>{console.log("backend is running")})