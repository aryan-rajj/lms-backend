import { Schema,model } from "mongoose";

const courseSchema = new Schema({
    title:{
        type:String,
        required:[true,"Title is required for course"],
        trim:true,
        minLength:[5,"Title should be more elaborative"],
        maxLength:[20,"Title should be less than 15 characters"],
    },
    description:{
        type:String,
        required:[true,"Description is required"],
        minLength:[5,"Description should be more in details"],
        maxLength:[50,"Less elaborative must be within 50 characters"],
    },
    category:{
        type:String,
        required:[true,"Category should be mentioned"],
    },
    thumbnail:{
        public_id:{
            type:String,
            // required:true,
        },
        secure_url:{
            type:String,
            // required:true,
        }
    },
    lectures: [
      {
        title: String,
        description: String,
        lecture: {
          public_id: {
            type: String,
            required: true,
          },
          secure_url: {
            type: String,
            required: true,
          },
        },
      },
    ],
    numberOfLectures: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      required: [true, 'Course instructor name is required'],
    },
}
,{
    timestamps:true,
})

const Course = model('Course',courseSchema);

export default Course;
