import User from "../models/user.model.js";
import OTP from "../models/otp.model.js";
import otpGenerator from "otp-generator";
import sendMail from "../services/sendMail.js";
import otpTemplate from "../mails/templates/otpVerification.js";
import uploadToCloudinary from "../services/uploadToCloudinary.js";
import jwt from "jsonwebtoken";

const sendOtp = async (req, res) => {
  try {
    // get user's email from req.body
    const { email } = req.body;

    // validate user's email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is Required",
      });
    }

    // check whether user already requested otp
    const existingUser = await OTP.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // generate new otp
    const generatedOtp = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    // send this otp to user
    const response = sendMail(
      "Wassup Team",
      email,
      "Verification Mail",
      otpTemplate(generatedOtp)
    );

    const user = await OTP.create({
      email,
      otp: generatedOtp,
    });

    return res.status(201).json({
      success: false,
      message: "OTP Sent Successfully",
      data: user,
    });
  } catch (error) {
    console.log(`Error Occured while Sending OTP to User:- ${error}`);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending OTP to User",
    });
  }
};

const registerController = async (req, res) => {
  try {
    // get data from req.body
    const { firstName, lastName, userName, email, password, otp } = req.body;

    // validate data
    if (!firstName || !lastName || !userName || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check whether user has already registered
    const existingUser = await User.findOne({
      $or: [{ email }, { userName }],
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // get user's avatar from req.file
    const avatarLocalPath = req.file.path;

    if (!avatarLocalPath) {
      return res.status(400).json({
        success: false,
        message: "Avatar is required",
      });
    }

    // check whether otp matches
    const otpdoc = await OTP.findOne({ email });

    if (!otpdoc) {
      return res.status(404).json({
        success: false,
        message: "User's otp not found, Generate OTP first",
      });
    }
    const userOtp = otpdoc.otp;

    if (userOtp !== otp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (otpdoc.expiresIn < Date.now()) {
      await OTP.findByIdAndDelete(otpdoc._id);
      return res.status(400).json({
        success: false,
        message: "OTP Expires",
      });
    }

    // upload user's avatar to cloudinary
    const uploadedAvatar = await uploadToCloudinary(avatarLocalPath);
    if (!uploadedAvatar) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong while uploading your avatar",
      });
    }

    // create new user's document
    const user = await User.create({
      firstName,
      lastName,
      userName,
      email,
      password,
      avatar: uploadedAvatar.url,
    });

    // return response
    return res.status(201).json({
      success: true,
      message: "User Created Successfully",
      data: user,
    });
  } catch (error) {
    console.log(`Error Occured while Registering the User:- ${error}`);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while registering the User",
    });
  }
};

const loginController = async (req, res) => {
  try {
    // get data from req.body
    const { userName, email, password } = req.body;

    // validate data
    if (!(userName || email) || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check whether user has already registered
    const user = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found, register first",
      });
    }

    // check whether the given password and user's password matches
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    // generate jwt token for user
    const payload = {
      id: user._id,
      email: user.email,
      userName: user.userName,
    };
    const jwtToken = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });
    if (!jwtToken) {
      return res.status(400).json({
        success: false,
        message:
          "Somethin went wrong while generating JWT Token, Please try again later",
      });
    }

    // return response
    return res
      .status(200)
      .cookie("jwtToken", jwtToken, {
        httpOnly: true,
        secure: true,
      })
      .json({
        success: true,
        message: "User logged in Successfully",
        data: payload,
        token: jwtToken,
      });
  } catch (error) {
    console.log(`Error Occured while Logging in the User:- ${error}`);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in the User",
    });
  }
};

const logoutController = async (req, res) => {
  try {
    res
      .status(200)
      .clearCookie("jwtToken", {
        httpOnly: true,
        secure: true,
      })
      .json({
        success: true,
        message: "User logged out successfully",
      });
  } catch (error) {
    console.log(`Error Occured while logging out the User:- ${error}`);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging out the User",
    });
  }
};

export { sendOtp, registerController, loginController, logoutController };
