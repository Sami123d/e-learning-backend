import express from "express";

const Router = express.Router();

Router.get("/", (req, res)=>{res.send("hey its user route")})

export default Router