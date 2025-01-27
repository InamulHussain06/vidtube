import { Router } from "express";
import { registerUser, logoutUser } from "../controllers/user.controllers.js";
import { upload, veifyJWT } from "../middleware/multer.middlewares.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/logout").post(veifyJWT, logoutUser);

export default router;
