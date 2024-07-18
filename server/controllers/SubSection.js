const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadMediaToCloudinary } = require("../utils/mediaUploader");

//creating subsection
exports.createSubSection = async (req, res) => {
  try {
    //fetching data;
    const { sectionId, title, timeDuration, description } = req.body;
    //fetching video
    const video = req.files.videoFile;
    //validating
    if (!sectionId || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "All fields are required while creating subsection",
      });
    }
    //upload video to cloudinary
    const uploadDetails = await uploadMediaToCloudinary(
      video,
      process.env.FOLDER_NAME
    );
    //create a subsection
    const subSectionDetails = await SubSection.create({
      title: title,
      timeDuration: timeDuration,
      description: description,
      videoUrl: uploadDetails.secure_url,
    });
    //update section with new subsection id
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          subSection: subSectionDetails._id,
        },
      },
      { new: true }
    ).populate("subSection");
    //return response
    return res.status(200).json({
      success: true,
      message: "Subsection created Successfully.",
      data:updatedSection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while creating Subsection",
      error: error.message,
    });
  }
};

//updateSubsection
exports.updateSubSection = async (req, res) => {
  try {
    //fetching data
    const { title, subSectionId } = req.body;
    //validatae
    if (!title || !subSectionId) {
      return res.status(400).json({
        success: false,
        message: "All details are required to update the subsection",
      });
    }
    //update subsection
    const updatedSubsection = await SubSection.findByIdAndUpdate(
      subSectionId,
      { title },
      { new: true }
    );
    //return response
    return res.status(200).json({
      success: true,
      message: "Subsection updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while updating the subsection",
      error: error.message,
    });
  }
};

//delete subsection
exports.deleteSubSection = async (req, res) => {
  try {
    //fetching subsection id
    const { subSectionId } = req.params;
    //delete id
    await SubSection.findByIdAndDelete(subSectionId);
    //return res
    return res.status(200).json({
      success: true,
      message: "Subsection deleted Successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while deleting the subsection",
    });
  }
};
