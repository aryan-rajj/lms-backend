import { Router } from "express";
import { getAllCourses,getLeactureByCourseId,updateCourseById,removeCourseById,createCourse,addLeactureToCourseById,removeLectureFromCourse } from "../controllers/course.controllers.js";
import { isLoggedIn,authorizedRole } from "../middlewares/auth.middleware.js";
import upload from '../middlewares/multer.middleware.js'

const router=Router();

router.route('/')
.get(
    getAllCourses
)
.post(
    isLoggedIn,
    authorizedRole("ADMIN"),
    upload.single('thumbnail'),
    createCourse
)
.delete(
    isLoggedIn,
    authorizedRole('ADMIN'),
    removeLectureFromCourse
);

router.route('/:id')
.get(
    isLoggedIn,
    getLeactureByCourseId
)
.put(
    isLoggedIn,
    authorizedRole('ADMIN'),
    updateCourseById
)
.delete(
    isLoggedIn,
    authorizedRole('ADMIN'),
    removeCourseById
)
.post(
    isLoggedIn,
    authorizedRole('ADMIN'),
    upload.single('lecture'),
    addLeactureToCourseById
);

export default router;