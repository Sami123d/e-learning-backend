import express from "express";
import Notification from "../models/Notification.js";
import cors from "cors";

const app = express();
app.use(cors());
const Router = express.Router();

// Route to get all notifications
Router.get("/getnotifications", async (req, res) => {
  try {
    const notifications = await Notification.find({});
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

Router.put("/markasread/:id", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (notification) {
      notification.read = true;
      await notification.save();
      res.json({ message: "Notification marked as read" });
    } else {
      res.status(404).json({ message: "Notification not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

export default Router;
