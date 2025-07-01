const errorMiddleware=(err,req,res,next)=>{
    const message=err.message || "something went wrong";
    const statusCode=err.statusCode || 500;
    res.status(statusCode).json({
        success:false,
        message:message,
        stack:err.stack
    })
}

export default errorMiddleware;