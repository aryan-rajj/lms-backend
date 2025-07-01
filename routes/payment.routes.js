import { Router } from "express";
import {
  allPayment,
  buySubscription,
  cancelSubscription,
  getRazorpayKey,
  verifyPayment,
} from "../controllers/payment.controllers.js";
import { isLoggedIn ,isSubscribed} from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/razorpay-key").get(isLoggedIn,getRazorpayKey);
router.route("/subscribe").post(isLoggedIn,buySubscription);
router.route("/unsubscribe").post(isLoggedIn,isSubscribed,cancelSubscription);
router.route("/").get(isLoggedIn,isSubscribed,allPayment);
router.route("/verify").post(verifyPayment);

export default router;
