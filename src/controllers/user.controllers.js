import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  //validation
  if (
    [fullName, username, email, password]?.some((field) => field.trim() === "")
  ) {
    throw new ApiError(404, "All Fields are required!");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(422, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImagePath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage;

  if (coverImagePath) {
    coverImage = await uploadOnCloudinary(coverImagePath);
  }

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

  if (!userCreated) {
    throw new ApiError(500, "something went wrong!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User created Successfully"));
});

export { registerUser };
