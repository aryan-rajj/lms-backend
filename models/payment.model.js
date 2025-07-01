import { Schema, model } from "mongoose";

const paymentModel = new Schema({
  razorpay_payment_id: {
    type: String,
    required: true,
  },
  razorpay_subscription_id: {
    type: String,
    required: true,
  },
  razorpay_signature: {
    type: String,
    required: true,
  },
},{
    timestamps:true
});

const Payment = await model("Payment", paymentModel);

export default Payment;
