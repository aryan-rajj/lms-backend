import fs from "fs/promises";
import Course from "../models/course.model.js";
import AppError from "../utils/app.error.js";
import cloudinary from "cloudinary";
import path from "path";
// 4718 6091 0820 4366
const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({}).select("-lectures");
    if (!courses) {
      return next(new AppError("There are no course available", 400));
    }
    res.status(200).json({
      success: true,
      message: "All courses are listed here",
      courses,
    });
  } catch (e) {
    return next(new AppError(e.message, 400));
  }
};

const getLeactureByCourseId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return next(new AppError("There are no courses present of this id", 500));
    }
    res.status(200).json({
      success: true,
      message: "Course is listed here pls check this",
      lectures: course.lectures,
    });
  } catch (e) {
    return next(new AppError(e.message, 400));
  }
};
const createCourse = async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy) {
    return next(new AppError("All fields are required", 400));
  }

  const course = await Course.create({
    title,
    description,
    category,
    createdBy,
  });

  if (!course) {
    return next(
      new AppError("Course could not be created, please try again", 400)
    );
  }

  // Run only if user sends a file
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms", // Save files in a folder named lms
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in array
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }

      // After successful upload remove the file from local storage
      fs.rm(`uploads/${req.file.filename}`);
    } catch (error) {
      // Empty the uploads directory without deleting the uploads directory
      for (const file of await fs.readdir("uploads/")) {
        await fs.unlink(path.join("uploads/", file));
      }

      // Send the error message
      return next(
        new AppError(
          JSON.stringify(error) || "File not uploaded, please try again",
          400
        )
      );
    }
  }

  // Save the changes
  await course.save();

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    course,
  });
};
// const createCourse = async (req, res, next) => {
//   try {
//     const { title, description, createdBy, category } = req.body;

//     if (!title || !description || !createdBy || !category) {
//       return next(
//         new AppError("Some fields are missing, please try again", 400)
//       );
//     }

//     let result;
//     if (req.file) {
//       console.log("Uploaded file:", req.file);
//       console.log(req.file.path);
//       result = await cloudinary.v2.uploader.upload(req.file.path, {
//         folder: "lms",
//       });
//       // Remove file after upload
//       fs.removeSync(req.file.path);
//     }
//     console.log(result);

//     const course = await Course.create({
//       title,
//       description,
//       createdBy,
//       category,
//       thumbnail: {
//         public_id: result ? result.public_id : "",
//         secure_url: result ? result.secure_url : "",
//       },
//     });

//     if (!course) {
//       return next(new AppError("Course was not created", 500));
//     }

//     res.status(200).json({
//       success: true,
//       message: "Course created successfully",
//       course,
//     });
//   } catch (e) {
//     return next(
//       new AppError(
//         JSON.stringify(e) || "File not uploaded, please try again",
//         400
//       )
//     );
//   }
// };

const removeCourseById = async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return next(new AppError("Course not found for delete", 400));
  }
  await Course.findByIdAndDelete(id);
  res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  });
};
const updateCourseById = async (req, res, next) => {
  const { id } = req.params;
  const result = await Course.findByIdAndUpdate(
    id,
    {
      $set: req.body,
    },
    {
      runValidators: true,
    }
  );
  if (!result) {
    return next(
      new AppError("course not updated successfully pls try again", 400)
    );
  }
  res.status(200).json({
    success: true,
    message: "Course updated successfully",
  });
};

const addLeactureToCourseById = async (req, res, next) => {
  const { title, description } = req.body;
  const { id } = req.params;
  const course = await Course.findById(id);
  let lectureData = {};
  if (!title || !description) {
    return next(new AppError("some fiels or data are missing", 500));
  }
  if (!course) {
    return next(
      new AppError("No Course exist pls make new and try again!!", 400)
    );
  }
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        chunk_size: 500000000, // 100 mb size
        resource_type: "video", // Save files in a folder named lms
      });
      if (result) {
        lectureData.public_id = result.public_id;
        lectureData.secure_url = result.secure_url;
      }
      try {
        await  fs.rm(`uploads/${req.file.filename}`);
      } catch (e) {
        console.error("File removal error:", e.message);
      }
    } catch (e) {
      return next(new AppError(e.message, 500));
    }
  }
  course.lectures.push({
    title,
    description,
    lecture: lectureData,
  });
  course.numberOfLectures = course.lectures.length;

  // Save the course object
  await course.save();

  res.status(200).json({
    success: true,
    message: "Course lecture added successfully",
    course,
  });
};
//{{URL}}/api/v1/courses/:courseId/lectures/:lectureId
const removeLectureFromCourse = async (req, res, next) => {
  const { courseId, lectureId } = req.query;
  if (!courseId) {
    return next(new AppError("course Id not present", 400));
  }
  if (!lectureId) {
    return next(new AppError("leacture Id to remove not present", 500));
  }
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course is not present ", 400));
  }
  //we will find leacture index
  const lectureIndex = course.lectures.findIndex(
    (lecture) => lecture._id.toString() === lectureId.toString()
  );
  if (lectureIndex === -1) {
    return next(new AppError("leacture does not exists", 400));
  }
  // Delete the lecture from cloudinary
  await cloudinary.v2.uploader.destroy(
    course.lectures[lectureIndex].lecture.public_id,
    {
      resource_type: "video",
    }
  );

  // Remove the lecture from the array
  course.lectures.splice(lectureIndex, 1);

  // update the number of lectures based on lectres array length
  course.numberOfLectures = course.lectures.length;

  // Save the course object
  await course.save();

  // Return response
  res.status(200).json({
    success: true,
    message: "Course lecture removed successfully",
  });
};

export {
  getAllCourses,
  getLeactureByCourseId,
  createCourse,
  updateCourseById,
  removeCourseById,
  addLeactureToCourseById,
  removeLectureFromCourse,
};
