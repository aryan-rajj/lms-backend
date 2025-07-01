import AppError from "../utils/app.error.js";
import User from "../models/user.models.js";
import crypto from "crypto";
import { razorpay } from "../server.js";
import Payment from "../models/payment.model.js";
const getRazorpayKey = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Razorpay API key",
    key: process.env.RAZORPAY_KEY_ID,
  });
};
const buySubscription = async (req, res, next) => {
  const { id } = req.user;
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("Unauthorized, please login"));
  }
  if (user.role === "ADMIN") {
    return next(new AppError("Admin cannot purchase any course", 500));
  }
  //creating the subscription on razorpay
  const subscription = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID, // The unique plan ID
    customer_notify: 1, // 1 means razorpay will handle notifying the customer, 0 means we will not notify the customer
    total_count: 12, // 12 means it will charge every month for a 1-year sub.
  });
  user.subscription.id = subscription.id;
  user.subscription.status = subscription.status;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Subscribed successfully",
    subscription_id: subscription.id,
  });
};
const cancelSubscription = async (req, res, next) => {
  const { id } = req.user;
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("user not found for cancel subscription", 500));
  }
  if (user.role !== "ADMIN") {
    return next(new AppError("Admin cannot cancel any course", 500));
  }
  const subscriptionId = use.subscription.id;

  const subscription = await razorpay.subscriptions.cancel(subscriptionId);
  user.subscription.id = subscription.id;
  user.subscription.status = subscription.status;
  await user.save();

  //payment details
  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });
  const timeSinceSubscribed = Date.now() - payment.createdAt;
  // refund period which in our case is 14 days
  const refundPeriod = 14 * 24 * 60 * 60 * 1000;

  // Check if refund period has expired or not
  if (refundPeriod <= timeSinceSubscribed) {
    return next(
      new AppError(
        "Refund period is over, so there will not be any refunds provided.",
        400
      )
    );
  }

  // If refund period is valid then refund the full amount that the user has paid
  await razorpay.payments.refund(payment.razorpay_payment_id, {
    speed: "optimum", // This is required
  });

  user.subscription.id = undefined; // Remove the subscription ID from user DB
  user.subscription.status = undefined; // Change the subscription Status in user DB

  await user.save();
  await payment.remove();

  // Send the response
  res.status(200).json({
    success: true,
    message: "Subscription canceled successfully",
  });
};

const verifyPayment = async (req, res, next) => {
  const { id } = req.user;
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
    req.body;
  const user = User.findById(id);
  const subscriptionId = user.subscription.id;
  if (!user) {
    return next(new AppError("user not found", 400));
  }
  const generateSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${razorpay_payment_id}|${subscriptionId}`)
    .digest("hex");

  if (generateSignature !== razorpay_signature) {
    return next(new AppError("payment unssucssefull", 500));
  }
  //If they match create payment and store it in the DB
  await Payment.create({
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  });

  // Update the user subscription status to active (This will be created before this)
  user.subscription.status = "active";

  // Save the user in the DB with any changes
  await user.save();

  res.status(200).json({
    success: true,
    message: "Payment verified successfully",
  });
};
const allPayment = async (req, res, next) => {
  const { count } = req.query;
  const allPayments = razorpay.subscriptions.all({
    count: count ? count : 10,
  });
  res.status(200).json({
    success: true,
    message: "All payments",
    allPayments,
    finalMonths,
    monthlySalesRecord,
  });
};
export {
  getRazorpayKey,
  buySubscription,
  cancelSubscription,
  verifyPayment,
  allPayment,
};
