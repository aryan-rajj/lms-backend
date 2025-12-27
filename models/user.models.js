import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import crypto from "crypto";
import { type } from "os";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "name is required"],
      minlength: [5, "write more characters"],
      maxlength: [25, "does not exceed 25 characters"],
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      minlength: [8, "email at least be of 8 characters"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "password at least be of 8 characters"],
      trim: true,
      lowercase: true,
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: Date,
    },
    subscription:{
      id:String,
      status:{
        type:String,
        default:"inactive"
      }
    }
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods = {
  generateJWTToken: function () {
    return JWT.sign({ id: this.id, role: this.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });
  },
  comparePassword: async function (plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
  },
  generatePasswordResetToken: async function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.forgotPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000;

    return resetToken;
  },
};

//creation of collection name in database
const User = model("User", userSchema);
//export model
export default User;
