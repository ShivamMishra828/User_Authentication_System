import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const uploadToCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;

    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    console.log(`File Uploaded Successfully on Cloudinary:- ${response}`);
    fs.unlinkSync(filePath);
    return response;
  } catch (error) {
    console.log(`Error Occured while Uploading File to Cloudinary:- ${error}`);
    fs.unlinkSync(filePath);
    return null;
  }
};

export default uploadToCloudinary;
