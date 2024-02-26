import express from "express";
import {
  sendOtp,
  registerController,
  loginController,
  logoutController,
} from "../controllers/auth.controller.js";
import upload from "../middlewares/multer.middleware.js";
import verifyJwtToken from "../middlewares/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/send-otp", sendOtp);
authRouter.post("/register", upload.single("avatar"), registerController);
authRouter.post("/login", loginController);
authRouter.get("/logout", verifyJwtToken, logoutController);

export default authRouter;
