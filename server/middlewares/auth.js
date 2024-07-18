const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

//auth
exports.auth = async (req, res, next) => {
  try {
    //extract token
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization").replace("Bearer ", "");
    // if token is missing
    if(!token){
        return res.status(401).json({
            success:false,
            message:"Token in missing.",
        })
    }
    //verify token
    try{
        const decode=jwt.verify(token,process.env.JWT_SECRET);
        console.log(decode);
        req.user=decode;
    }catch(err){
        return res.status(401).json({
            success:false,
            message:"Token is invalid",
        })
    }
    next();
  } catch (error) {
      console.log(error);
      return res.status(401).json({
        success:false,
        message:"Error occur while validating token, Look at once."
      })
  }
};

//isStudent
exports.isStudent=async(req,res,next)=>{
    try{
         if(req.user.accountType!=="Student"){
            return res.status(401).json({
                success:false,
                message:"This is protected route for students only."
            })
         }
         next();
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Student User role is not verified."
        })
    }
}

//isInstructor
exports.isInstructor=async(req,res,next)=>{
    try{
         if(req.user.accountType!=="Instructor"){
            return res.status(401).json({
                success:false,
                message:"This is protected route for Instructor only."
            })
         }
         next();
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Instructor User role is not verified."
        })
    }
}

// IsAdmin
exports.isAdmin=async(req,res,next)=>{
    try{
         if(req.user.accountType!=="Admin"){
            return res.status(401).json({
                success:false,
                message:"This is protected route for Admin only."
            })
         }
         next();
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Admin User role is not verified."
        })
    }
}


