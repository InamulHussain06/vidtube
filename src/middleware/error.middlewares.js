import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  const error = err;
  
  if(!(error instanceof ApiError)){
      const statusCode=error.statusCode || error instanceof mongoose.Error ? 400 :500;

      const message=error.message || 'Something went wrong'

      error=new ApiError(statusCode,message,error?.error || [],err.stack)


  }


  const response={
    ...error,
    message:error.message,
    // ...(process.env.)
  }


};

export { errorHandler };
