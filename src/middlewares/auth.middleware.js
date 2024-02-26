import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const verifyJwtToken = async (req, res, next) => {
  try {
    // get token from req.cookies
    const { jwtToken } = req.cookies;

    if (!jwtToken) {
      return res.status(404).json({
        success: false,
        message: "Token not found",
      });
    }

    // verify the jwt token
    const decode = jwt.verify(jwtToken, process.env.JWT_SECRET);

    if (!decode) {
      return res.status(401).json({
        success: false,
        message: "Token has no payload",
      });
    }

    const user = await User.findById(decode.id).select("-password -resetToken");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid JWT Token",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.log(`Error Occured while Verifying JWT Token:- ${error}`);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while verifying JWT Token",
    });
  }
};

export default verifyJwtToken;
