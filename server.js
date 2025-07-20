import app from './app.js';
import connectionToDB from './config/connectionToDB.js';
import { v2 } from 'cloudinary';
import Razorpay from 'razorpay';
import dotenv from "dotenv";
dotenv.config();
const port=process.env.PORT || 5000;

v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Creating the razorpay secret
export const razorpay=new Razorpay({
  key_id:process.env.RAZORPAY_KEY_ID,
  key_secret:process.env.RAZORPAY_SECRET,
})

app.listen(port,async()=>{
    await connectionToDB();
    console.log(`Listening on port ${port}`);
})


