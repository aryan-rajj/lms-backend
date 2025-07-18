import JWT from "jsonwebtoken";
import AppError from "../utils/app.error.js";
import User from "../models/user.models.js";
const isLoggedIn = async (req, res, next) => {
  const {token}=req.cookies;
  if(!token){
      return next(new AppError("token not found",400));
  }
  const decoded=await JWT.verify(token,process.env.JWT_SECRET);
  if(!decoded){
      return next(new AppError('Unauthorized pls login to continue',400));
  }
  req.user=decoded;
  next();
//   const {token} =req.cookies

//   if (!token) {
//     return res.status(401).json({ message: "Not authorized, no token" });
//   }

//   try {
//     const decoded = JWT.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // assuming your token payload has id, email, etc.
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Token is invalid or expired" });
//   }
};
const authorizedRole =
  (...roles) =>
  async (req, res, next) => {
    const current = req.user.role;
    if (!current) {
      return next(new AppError("current role is not defined", 500));
    }
    if (!roles.includes(current)) {
      return next(new AppError("User is not ADMIN", 400));
    }
    next();
  };
const isSubscribed = async (req, res, next) => {
  const { id } = req.user;
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("User not found", 500));
  }
  const status = user.subscription.status;
  if (status !== "active") {
    return next(
      new AppError("user is not subscribed,pls subscribe first", 500)
    );
  }
  next();
};
export { isLoggedIn, authorizedRole, isSubscribed };
