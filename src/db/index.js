import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: DB_NAME,
    });
    console.log(
      `\n\t MongoDB Connected ! DB host: ${connectionInstance?.connection?.host}`
    );
  } catch (error) {
    console.error("MongoBD Connection error", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

export default connectDB;
