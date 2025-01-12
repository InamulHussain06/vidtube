import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv"

dotenv.config()
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

console.log('check',
  process.env.CLOUDINARY_CLOUD_NAME,
  process.env.CLOUDINARY_API_KEY,
  process.env.CLOUDINARY_API_SECRET
)

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("FILE UPLOADED", response);

    //once the file is deleted we would like to delete it from our server

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error('Error on cloudinary',error)
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deletefromCloudinary=async(publicId)=>{
  try {
   const result=await cloudinary.uploader.destroy(publicId);
   console.log('file deleted from cloudinary',result)
  } catch (error) {
    console.log('error while deleting file from cloudinary',error)
  }
}

export { uploadOnCloudinary,deletefromCloudinary};
