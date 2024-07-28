import express from "express";
import User from "../models/User.js";

const Router = express.Router();

Router.get("/", (req, res) => {
  res.send("hey its user route");
});

Router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ role: "Student" }); // Fetch only students
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to get the profile data of a user
Router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to update the profile data of a user
Router.put("/profile/update/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    // console.log(userId,updates);

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) {
      console.log(user);
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

Router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.deleteOne({ _id: id });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default Router;
