const User = require("../models/User");
const Profile = require("../models/Profile");
const {uploadMediaToCloudinary}=require("../utils/mediaUploader")
// Method for updating a profile
exports.updateProfile = async (req, res) => {
  try {
    //fetching data
    //this is how we write by default case.
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;
    //get user id
    const id = req.user.id;
    //validation
    if (!contactNumber || !gender || !id) {
      return res.status(400).json({
        success: false,
        message: "All details are required while updating profile",
      });
    }
    //find profile
    const UserDetails = await User.findById(id);
    const profile = await Profile.findById(UserDetails.additionalDetails);
    //update profile details
       profile.dateOfBirth = dateOfBirth;
       profile.about = about;
       profile.contactNumber = contactNumber;
       profile.gender = gender;
      //save this
      await profile.save();
    //return response
    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
      profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while Updating profile.",
      error: error.message,
    });
  }
};

//delete account
// we have deleteAccount functionality for students only
exports.deleteAccount = async (req, res) => {
  try {
    //fetching id
    const id = req.user.id;
    //validation
    const UserDetails = await User.findById({_id:id});
    if (!UserDetails) {
      return res.status(404).json({
        success: false,
        message: "details are missing while deleting account",
      });
    }
    //delete profile
    await Profile.findByIdAndDelete({ _id: UserDetails.additionalDetails });
    //delete user
    await User.findByIdAndDelete({ _id: id });
    //return response
    return res.status(200).json({
      success: true,
      message: "Account deleted Successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while deleting account.",
      error: error.message,
    });
  }
};

//get all user
exports.getAllUserDetails= async (req, res) => {
  try {
    const id = req.user.id;
    const UserDetails = await User.findById(id).populate("additionalDetails").exec();
    if (!UserDetails) {
      return res.status(404).json({
        success: false,
        message: "user is not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User all details fetched successfully.",
      data:UserDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while fetching all user details",
      error: error.message,
    });
  }
};

//Updation of display Picture
exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture
    const userId = req.user.id
    const image = await uploadMediaToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    )
    console.log(image)
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    )
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    })
  } catch (error) {
    console.log("Error while updatingDisplay Picture");
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
};

//get all enrolledCourses
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id
    const userDetails = await User.findOne({
      _id: userId,
    })
      .populate("courses")
      .exec()
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      })
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
};