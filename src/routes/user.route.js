import express from "express";
import upload from "../middlewares/multer.middleware.js";
import verifyJwtToken from "../middlewares/auth.middleware.js";
import {
  updateUserAvatar,
  updateUserDetails,
  changePassword,
  generateResetToken,
  resetPassword,
} from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.post("/reset-token", generateResetToken);
userRouter.post("/reset-password", resetPassword);
userRouter.use(verifyJwtToken);
userRouter.post("/update-avatar", upload.single("avatar"), updateUserAvatar);
userRouter.post("/update-details", updateUserDetails);
userRouter.post("/change-password", changePassword);

export default userRouter;
