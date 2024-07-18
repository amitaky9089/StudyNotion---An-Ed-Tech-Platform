const Section = require("../models/Section");
const Course = require("../models/Course");

// creating a section
exports.createSection = async(req, res) => {
  try {
    //fetching data from body
    //sectionName to create section and courseId to update courseSection.
    const { sectionName, courseId } = req.body;
    //validation
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All details are required to create Section.",
      });
    }
    //create section in database
    const newSection = await Section.create({ sectionName });
    //update this section in courseSection part.
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    )
    .populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    })
    .exec();
    //return response
    return res.status(200).json({
      success: true,
      message: "Section Created Successfully.",
      updatedCourse,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Problem in creating Section.",
      error: error.message,
    });
  }
};

//updating a section with newName
exports.updateSection = async (req, res) => {
  try {
    //fetching data
    const { sectionName, sectionId } = req.body;
    //validating data
    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required while updating the section.",
      });
    }
    //update the section
    const section = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );
    //return res
    return res.status(200).json({
      success: true,
      message: "Section updated Successfully",
      section,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while updatin the section.",
      error: error.message,
    });
  }
};

//delete section
exports.deleteSection = async (req, res) => {
  try {
    //fetching sectionId
    const { sectionId } = req.body;
    //find section with this id and delete it
    await Section.findByIdAndDelete(sectionId);
    //return response
    return res.status(200).json({
      success: true,
      message: "Section deleted Successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while deleting section.",
      error: error.message,
    });
  }
};
