import AppError from "../utils/app.error.js";
import User from "../models/user.models.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";
import sendEmail from "../utils/send.email.js";
import crypto from "crypto";
const cookieOptions = {
  //   secure: process.env.NODE_ENV === 'production' ? true : false,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
};
const register = async (req, res, next) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return next(new AppError("Invealid credentials", 404));
  }
  const exists = await User.findOne({ email });

  if (exists) {
    return next(new AppError("email already exist try different", 409));
  }
  const user = await User.create({
    fullName,
    email,
    password,
    avatar: {
      public_id: email,
      secure_url:
        "https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg",
    },
  });
  if (!user) {
    return next(
      new AppError("user registration failed pls try again later", 404)
    );
  }
  //File Upload IN Cloudinary
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms", // Save files in a folder named lms
        width: 250,
        height: 250,
        gravity: "faces", // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
        crop: "fill",
      });
      if (result) {
        //set public id and secure url in db
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;
        //remove the file uploaded
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (e) {
      return next(new AppError(e || "something wrong with file upload", 500));
    }
  }

  await user.save();
  const token = user.generateJWTToken();

  user.password = undefined;
  res.cookie("token", token, cookieOptions);

  res.status(200).json({
    success: true,
    message: "user registered successfully",
    user,
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError("email or password left blank or invalid", 400));
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user && (await user.comparePassword(password))) {
      return next(new AppError("email or password does not match", 404));
    }
    const token = await user.generateJWTToken();
    user.password = undefined;
    if (!token) {
      return next(new AppError("invalid token", 404));
    }
    res.cookie("token", token, cookieOptions);
    res.status(200).json({
      success: true,
      message: "user looged in successfully",
      user,
    });
  } catch (e) {
    return next(new AppError(e.message, 404));
  }
};

const logout = (req, res, next) => {
  // in logout setting the cookie value to null
  res.cookie("token", null, {
    maxAge: 0,
    httpOnly: true,
  });
  //sending the messages
  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};
const getProfile = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    message: "profile details",
    user,
  });
};
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError("Email is required for reset", 400));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("Email is not registered", 400));
  }
  const resetToken = await user.generatePasswordResetToken();
  console.log(resetToken);
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const subject = "Reset Password";
  const message = `
  <p>You can reset your password by clicking the link below:</p>
  <p><a href="${resetPasswordUrl}" target="_blank">Reset your password</a></p>
  <p>If the above link does not work, copy and paste this URL into your browser:</p>
  <p>${resetPasswordUrl}</p>
  <br/>
  <p>If you did not request this, please ignore this email.</p>
`;
await user.save();
  try {
    await sendEmail(email, subject, message);
    res.status(200).json({
      success: true,
      message: "message sent to your registered email pls reset password",
    });
  } catch (e) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();
    return next(
      new AppError(
        `something error while sending ${email} pls try again and ${e.message}`,
        500
      )
    );
  }
};
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { resetToken } = req.params;
    if (!password) {
      return next(
        new AppError("Password is required for change or reset", 500)
      );
    }
    console.log(resetToken);
    const forgotPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      forgotPasswordToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });
    if (!user) {
      return next(
        new AppError("Token is invalid or expired, please try again", 400)
      );
    }
    //update the password
    user.password = password;

    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Pssword reset successfully",
    });
  } catch (e) {
    return next(new AppError(e.message || "something error happened", 400));
  }
};
const changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;
  if (!oldPassword || !newPassword) {
    return next(
      new AppError("passwords are required,pls provide for change", 500)
    );
  }
  try {
    const user = await User.findById(id).select("+password");
    console.log(user);
    if (!user) {
      return next(new AppError("Invalid user id or user does not exists", 400));
    }
    const cmp = user.comparePassword(oldPassword);
    if (!cmp) {
      return next(new AppError("invalid old password", 400));
    }
    user.password = newPassword;
    await user.save();
    //setting the password undefined so that it dont get set in res
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (e) {
    return next(
      new AppError(
        `Something went wrong while changeing password or ${e.message}`,
        400
      )
    );
  }
};
const updateProfile = async (req, res, next) => {
  const { fullName } = req.body;
  const { id } = req.user;
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("User is not registered or invalid user id", 400));
  }
  //if all things are right then we change the name
  if (fullName) {
    user.fullName = fullName;
  }
  //run only when user send a file
  if (req.file) {
    //delete all the image uploaded by user
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms", // Save files in a folder named lms
        width: 250,
        height: 250,
        gravity: "faces", // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
        crop: "fill",
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in DB
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        // After successful upload remove the file from local storage
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (e) {
      return next(
        new AppError(e.message || "File not updated pls try again", 400)
      );
    }
  }
  await user.save();

  res.status(200).json({
    success: true,
    message: "User details updated successfully",
  });
};
export {
  register,
  login,
  logout,
  getProfile,
  resetPassword,
  forgotPassword,
  changePassword,
  updateProfile,
};
