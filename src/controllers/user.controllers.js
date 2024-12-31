import { asyncHandler } from "../utils/asyncHandler";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, userName, email } = req.body;
});

export { registerUser };
