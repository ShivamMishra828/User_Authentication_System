import User from "../models/user.model.js";
import uploadToCloudinary from "../services/uploadToCloudinary.js";
import crypto from "crypto";
import sendMail from "../services/sendMail.js";
import resetTokenTemplate from "../mails/templates/resetPasswordToken.js";
import jwt from "jsonwebtoken";

const updateUserAvatar = async (req, res) => {
  try {
    // get user's id from req.user
    const userId = req.user.id;

    // get avatar from req.file
    const avatarLocalPath = req.file.path;
    if (!avatarLocalPath) {
      return res.status(400).json({
        success: false,
        message: "Avatar is Required",
      });
    }

    // find user from user's id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // upload user's avatar to cloudinary
    const uploadedAvatar = await uploadToCloudinary(avatarLocalPath);
    if (!uploadedAvatar) {
      return res.status(400).json({
        success: false,
        message: "Avatar Upload Failed",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          avatar: uploadedAvatar.url,
        },
      },
      { new: true }
    ).select("-password -resetToken");

    // return response
    return res.status(200).json({
      success: true,
      message: "Avatar Updated Successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(`Error Occured while Updating User Avatar:- ${error}`);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while Updating User Avatar",
    });
  }
};

const updateUserDetails = async (req, res) => {
  try {
    // get user's id from req.user
    const userId = req.user.id;

    // if user's id didn't found
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "User's Id not found",
      });
    }

    // fetch user's details corresponding to user's id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // get user's details from req.body
    const { firstName, lastName, email, userName } = req.body;

    // validate data
    if (!(firstName || lastName || email || userName)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check whether any userName or email are already used
    const existingUser = await User.findOne({
      userName,
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "UserName already used",
      });
    }

    // update user's details using user's id
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          firstName,
          lastName,
          email,
          userName,
        },
      },
      { new: true }
    ).select("-password -resetToken");

    // return response
    return res.status(201).json({
      success: true,
      message: "User Details Updated Successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(`Error Occured while Updating User Details:- ${error}`);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating user's details",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    // get data from req.body
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    // validate data
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(401).json({
        success: false,
        message: "New Password and Confirm New Password doesn't match",
      });
    }

    // get user's id from req.user
    const userId = req.user.id;

    // fetch user details corresponding to user's id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid Old Password",
      });
    }

    // update user's password
    user.password = newPassword;
    await user.save();

    // return response
    return res.status(201).json({
      success: false,
      message: "Password Changed Successfully",
      data: user,
    });
  } catch (error) {
    console.log(`Error Occcured while Changing Password:- ${error}`);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while changing password",
    });
  }
};

const generateResetToken = async (req, res) => {
  try {
    // get user's email from req.body
    const { email } = req.body;

    // validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is Required",
      });
    }

    // check whether user's email exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const link = `http://localhost:5000/user/reset-password?token=${token}`;

    const response = sendMail(
      "Wassup Team",
      email,
      "Reset Password Mail",
      resetTokenTemplate(link)
    );

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          resetToken: token,
        },
      },
      { new: true }
    );

    // generate jwtToken
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res
      .status(200)
      .cookie("resetToken", jwtToken, {
        httpOnly: true,
        secure: true,
      })
      .json({
        success: true,
        message: "Reset Password Mail Sent Successfully",
        data: updatedUser,
      });
  } catch (error) {
    console.log(`Error Occured while Generating Reset Token:- ${error}`);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while Generating Reset Token",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    // get resetToken from req.query
    // get data from req.body
    const { newPassword, confirmNewPassword, token } = req.body;

    // validate token
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset Token is required",
      });
    }

    // check whether token is correct or not
    const { resetToken } = req.cookies;
    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "Reset Token is requried",
      });
    }

    const decode = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (!decode) {
      return res.status(401).json({
        success: false,
        message: "Token has no payload",
      });
    }

    const user = await User.findById(decode.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid JWT Token",
      });
    }

    if (user.resetToken !== token) {
      return res.status(400).json({
        success: false,
        message: "Invalid Reset Token",
      });
    }

    if (user.resetTokenExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Reset Token Expires",
      });
    }

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New Password and Confirm New Password doesn't match",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          password: newPassword,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Password Reset Successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(`Error Occured while Resetting Password:- ${error}`);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while Resetting your Password",
    });
  }
};

export {
  updateUserAvatar,
  updateUserDetails,
  changePassword,
  generateResetToken,
  resetPassword,
};
