import Course from "../models/course.model.js";
import AppError from "../utils/app.error.js";

const getAllCourses = async (req, res, next) => {
  try {
    const course = await Course.find({}).select("-leactures");
    if (!course) {
      return next(new AppError("There are no course available", 400));
    }
    res.status(200).json({
      success: true,
      message: "All courses are listed here",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 400));
  }
};

const getLeactureByCourseId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = Course.findById(id);
    if (!course) {
      return next(new AppError("There are no courses present of this id", 500));
    }
    res.status(200).json({
      success: true,
      message: "Course is listed here pls check this",
      leactures: course.leactures,
    });
  } catch (e) {
    return next(new AppError(e.message, 400));
  }
};
const createCourse = async (req, res, next) => {
  try {
    const { title, description, createdBy, category } = req.body;
    if (!title || !description || !createdBy || !category) {
      return next(new AppError("Some field are missing, pls try again", 500));
    }
    const course = await Course.create({
      title,
      description,
      createdBy,
      category,
    });
    if (!course) {
      return next(new AppError("course was not created", 500));
    }

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms", // Save files in a folder named lms
      });
    }
    if (result) {
      course.thumbnail.public_id = result.public_id;
      course.thumbnail.secure_url = result.secure_url;
    }
    fs.remove(`/uploads/${req.file.filename}`);
  } catch (e) {
    return next(
      new AppError(
        JSON.stringify(e) || "File not uploaded, please try again",
        400
      )
    );
  }
  await course.save();

  res.status(200).json({
    success: true,
    message: "Course created successfully",
    course,
  });
};
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
  let leactureData = {};
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
        chunk_size: 50000000, // 50 mb size
        resource_type: "video", // Save files in a folder named lms
      });
      if (result) {
        leactureData.public_id = result.public_id;
        leactureData.secure_url = result.secure_url;
      }
      fs.remove(`/uploads/${req.file.filename}`);
    } catch (e) {
      return next(new AppError(e.message, 500));
    }
  }
  course.lectures.push({
    title,
    description,
    leactureData,
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
