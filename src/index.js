import app from "./app.js";
import connectToDB from "./config/database.js";
import dotenv from "dotenv";
import { createServer } from "http";

dotenv.config();
const PORT = process.env.PORT;
const server = createServer(app);

connectToDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is Running at Port:- ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB Connection Failed:- ${error}`);
    process.exit(1);
  });
