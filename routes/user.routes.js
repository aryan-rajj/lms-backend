import { Router } from "express";
import { login,logout,getProfile,register, forgotPassword, resetPassword, updateProfile, changePassword } from "../controllers/user.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
const router=Router();

router.post('/register',upload.single("avatar"),register);
router.post('/login',login);
router.get('/logout',logout);
router.get('/me',isLoggedIn,getProfile);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password/:resetToken',resetPassword);
router.post('/change-password',isLoggedIn,changePassword);
router.put('/update/:id',isLoggedIn,upload.single("avatar"),updateProfile);

export default router;