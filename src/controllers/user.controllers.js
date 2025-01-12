import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deletefromCloudinary,
} from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  if (Object.keys(req.body).length === 0) {
    throw new ApiError(404, "Request body is required and cannot be empty");
  }

  //validation
  if (
    [fullName, username, email, password]?.some((field) => field?.trim() === "")
  ) {
    throw new ApiError(404, "All Fields are required!");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  console.log(existingUser, "existing");

  if (existingUser) {
    throw new ApiError(422, "User with email or username already exists");
  }

  console.log("req.files", req.files);

  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is required");
  }

  let avatar;

  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Uploaded avatat", avatar);
  } catch (error) {
    console.log("error uploading avatar", error);
    throw new ApiError(500, "Failed to upload avatar");
  }

  let coverImage;
  try {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log("Uploaded coverImage", coverImage);
  } catch (error) {
    console.log("error uploading coverImage", error);
    throw new ApiError(500, "Failed to upload coverImage");
  }

  try {
    const user = await User.create({
      fullName,
      email,
      password,
      username: username?.toLowerCase(),
      avatar: avatar?.url,
      coverImage: coverImage?.url || "",
    });

    //An extra query to check that our data is created in the database

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "something went wrong!");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, createdUser, "User created Successfully"));
  } catch (error) {
    console.log("User creation failed", error);
    if (avatar) {
      deletefromCloudinary(avatar?.public_id);
    }
    if (coverImage) {
      deletefromCloudinary(coverImage?.public_id);
    }

    throw new ApiError(
      500,
      "Something went wrong while creating a User in the Database and Images were deleted"
    );
  }
});

export { registerUser };
