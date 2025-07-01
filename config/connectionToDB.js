import mongoose from "mongoose";
mongoose.set("strictQuery", false);

const URL = process.env.MONGO_URL;

const connectionToDB = async (req, res) => {
  try {
    const { connection } = await mongoose.connect(
      URL || "mongodb://localhost:27017/lms"
    );
    if (connection) {
      console.log(`Connected to database ${connection.host}`);
    }
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
};

export default connectionToDB;
