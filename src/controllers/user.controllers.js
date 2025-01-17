import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deletefromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

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
      "Something went wrong while creating a User in the Database and images were deleted"
    );
  }
});

const loginHandler = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  //validation email
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  //getting User data from the DB
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  //Validating password or checking password from user and DB
  const isValidPassword = await user.isPasswordCorrect(password);

  if (!isValidPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { refreshToken, accessToken } = await generateAccessandRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(404, "User not found");
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookies("accessToken", accessToken, options)
    .cookies("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // const { refreshToken } = req.body;

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(404, "Invalid refresh token");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshAccessToken: updatedRefreshToken } =
      await generateAccessandRefreshToken(user?._id);

    return res
      .status(200)
      .cookies("accessToken", accessToken, options)
      .cookies("refreshToken", updatedRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: updatedRefreshToken,
          },
          "Access Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while refreshing access token"
    );
  }
});

const logoutUser = asyncHandler(async (refreshAccessToken, res) => {
  await User.findByIdAndUpdate(req.user._id);
});

export { registerUser, loginHandler, refreshAccessToken };
