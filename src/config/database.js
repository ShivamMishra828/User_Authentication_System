import mongoose from "mongoose";

const connectToDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);

    console.log(
      `MongoDB Connected Successfully to Host:- ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log(`Error Occured while Connecting to Database:- ${error}`);
    process.exit(1);
  }
};

export default connectToDB;
