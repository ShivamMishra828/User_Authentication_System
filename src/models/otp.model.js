import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is Required"],
  },
  otp: {
    type: String,
  },
  expiresIn: {
    type: Date,
    default: () => Date.now() + 5 * 60 * 1000,
  },
});

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
