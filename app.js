import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import morgan from "morgan";
import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.routes.js";
import errorMiddleware from "./middlewares/errorMiddlewares.js";
import paymentRoutes from "./routes/payment.routes.js";
config();
const app = express();
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/ping", (req, res) => {
  res.send("Pong");
});
<<<<<<< HEAD
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "LMS Backend is running 🚀"
  });
});
=======


>>>>>>> 0d89d58 (some changes in schema model.js code)
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.post("/api/v1/user/contact", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Contact mat karo!!",
    req,
  });
});
app.use((req, res) => {
  res.status(400).json({
    message: "Page not found",
  });
});

app.use(errorMiddleware);

export default app;
