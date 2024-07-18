const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const { response } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();

//sendOTP for mail verification
exports.sendotp = async (req, res) => {
  try {
    //fetching email from req.body
    const { email } = req.body;
    //check if user is already registered or not.
    const checkUserPresent = await User.findOne({ email });
    //if present
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already registered.",
      });
    }
    //if not present then generate OTP.(use otp-generator package)
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("Generated OTP ", otp);
    //check if unique otp or not
    const result = await OTP.findOne({ otp: otp });
    console.log("Result is Generated OTP Func");
    console.log("OTP", otp);
    console.log("Result", result);
    // if exist
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        // lowerCaseAlphabets: false,
        // specialChars: false,
      });
      // result = await OTP.findOne({ otp: otp });
    }
    //finally we have unique otp, now create an entry in database.
    const otpPayload = { email, otp };
    //create db entry for new otp with corresponding email
    const otpBody = await OTP.create(otpPayload);
    console.log("otpBody: ", otpBody);
    //return response
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//signUp Controller for Registering User.
exports.signup = async (req, res) => {
  try {
    //fetching data from req.body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;
    //validation if any details are missing or not
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All fields are required.",
      });
    }
    //if both password does not match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and confirmPassword doesn't match ,Please try again.",
      });
    }
    //check if user exist or not
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User is already registered , Please sign in to continue.",
      });
    }
    //if not exist then find most recent otp obtained.
    // It sorts the documents based on their creation timestamp (createdAt) in descending order and limits the result to one document.
    // recentOTP->response
    const response = await OTP.find({ email:email }) // this will return an array of documents have given email id.
      .sort({ createdAt: -1 })
      .limit(1);
    console.log("Recent OTP ", response);
    //validate OTP
    if (response.length === 0) {
      // otp not found for this  email
      return res.status(400).json({
        success: false,
        message: "This OTP is not Valid.",
      });
    } else if (otp !== response[0].otp) {
      // invalid otp
      return res.status(400).json({
        success: false,
        message: "Invalid OTP, Write Correct OTP.",
      });
    }
    //if everything goes well then hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    //create the user
    let approved = "";
    approved === "Instructor" ? (approved = false) : (approved = true);
    // creating the Additional Profile for User
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType: accountType,
      approved: approved,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    //return response
    return res.status(200).json({
      success: true,
      message: `User registered Successfully`,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "User Cannot be registered, Try Again!.",
    });
  }
};

//login controller for authencating users
exports.login = async (req, res) => {
  try {
    //fetching gmail and password
    const { email, password } = req.body;
    //validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please Fill up all the required fileds.",
      });
    }
    //check provided email user exist or not
    const user = await User.findOne({ email }).populate("additionalDetails");
    //if not exist
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registered with us, Please signUp to Continue",
      });
    }
    // generate jwt token and compare password
    if (await bcrypt.compare(password, user.password)) {
      // const payload = {
      //   email: user.email,
      //   id: user._id,
      //   accountType: user.accountType,
      // };
      const token = jwt.sign(
        {
          email: user.email,
          id: user._id,
          accountType: user.accountType,
        }, 
        process.env.JWT_SECRET,
         {
        expiresIn: "24000h",
         }
    );
      //save token to user document in database
      user.token = token;
      user.password = undefined;
      //set cookie for token and return response
      const options = {
        expires: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      return res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "User logged in Successfully.",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Login Failure, Please try again.",
    });
  }
};

//Contorller for password change
exports.changePassword = async (req, res) => {
  try {
    // getting user details ,as user is already login
    const userDetails = await User.findById(req.user.id); //return a document(object)
    //fetching data from req.body
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    //validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "The password is incorrect",
      });
    }
    //validate newPassword with newconfirmPassword
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "newpassword and newCofirmPassword are not matching.",
      });
    }
    //update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    );
    //send Notification mail with updated Password
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      );
      console.log("Email sent successfully:", emailResponse.response);
    } catch (error) {
      //if error while sending the mail ,return internal server error 500
      console.error("Error occured while sending the mail ", error);
      return res.status(500).json({
        success: false,
        message: "Error Occured while sending the mail",
        error: error.message,
      });
    }
    //if everything runs successfully then return success response.
    return res.status(200).json({
      success: true,
      message: "Password Updated Successfully.",
    });
  } catch (error) {
    //if there is an error while updating the password ,return internal server error 500
    console.error("Error occur while updating the password: ", error);
    return res.status(500).json({
      success: false,
      message: "Error Occurs while udating the password",
      error: error.message,
    });
  }
};
