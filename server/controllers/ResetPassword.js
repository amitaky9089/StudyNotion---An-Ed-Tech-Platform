const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto=require("crypto");

//resetpasswordToken -create a token and send mail.
exports.resetPasswordToken = async (req, res) => {
  try {
    //get email from req.body
    const email = req.body.email;
    // validating email
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.json({
        success: false,
        message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
      });
    }
    // if registered then generate token -> generate random token
    const token = crypto.randomBytes(20).toString("hex");
    //update user by adding token and expiration time.
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 3600000, //newly generated token expires in 5 mins.
      },
      {
        new: true,
      }
    );
    //creating url
    const url = `http://localhost:3000/update-password/${token}`;
    //sending mail containing url
    await mailSender(
      email,
      "Password Reset Link",
      `Your Link for email verification is ${url}. Please click this url to reset your password. `
    );
    //return response
    return res.status(200).json({
      success: true,
      message:
        "Reset Password mail sent successfully. Check and reset Password.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error occured while sending the reset password mail link.",
    });
  }
};

//resetpassword-db me reset krne ka kaam ye kr rha hai
exports.resetPassword = async (req, res) => {
  try {
    //data fetch
    const { password, confirmPassword, token } = req.body;
    //validation
    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Passwords are not matching, Try Again!",
      });
    }
    //get userdetail from db using token
    const userDetails = await User.findOne({ token: token });
    if (!userDetails) {
      return res.json({
        success: false,
        message: "Token is invalid, Check Once.",
      });
    }
    //token timing check
    if (!(userDetails.resetPasswordExpires > Date.now())) {
      return res.json({
        success: false,
        message: "Token is invalid, Regenerate Token.",
      });
    }
    //password hashing
    const encryptedPassword = await bcrypt.hash(password, 10);
    //password Update
    await User.findOneAndUpdate(
      { token: token },
      { password: encryptedPassword },
      {
        new: true,
      }
    );
    return res.status(200).json({
      success: true,
      message: "Password Reset successfull.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error while updating the password.",
    });
  }
};
