//download razorpay (npm i razorpay)
const { default: mongoose } = require("mongoose");
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");

//capture the payment and intialise the Razorpay order
// this order creation part
exports.capturePayment = async (req, res) => {
  //get course_id and user_id
  const { course_id } = req.body;
  const userId = req.user.id;
  //Validation on courseId
  if (!course_id) {
    return res.json({
      success: false,
      message: "Provide Valid CourseId.",
    });
  }
  //valid CourseDetails
  let course;
  try {
    course = await Course.findById(course_id);
    if (!course) {
      return res.json({
        success: false,
        message: "Could not find the Course.",
      });
    }
    //converting string userId to objectUserId
    const uid = new mongoose.Types.ObjectId(userId);
    //check if user already paid for the same course or not.
    if (course.studentsEnrolled.includes(uid)) {
      return res.status(200).json({
        success: false,
        message: "Student is already enrolled.",
      });
    }
  } catch (error) {
    console.log("Error occured while validating student in course");
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  //if everything is ok, we are ready to create order
  const amount = course.price;
  const currency = "INR";
  //creating object to create or initialise order
  const options = {
    amount: amount * 100,
    currency,
    reciept: Math.random(Date.now()).toString(),
    notes: {
      courseId: course_id,
      userId,
    },
  };
  //for third party interaction using try catch block
  try {
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);
    return res.status(200).json({
      success: true,
      message: "Order Created Successfully",
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      orderId: paymentResponse.id,
      currency: paymentResponse.currency,
      amount: paymentResponse.amount,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Could not initiate Order.",
    });
  }
};

// Verification part
// Verify signature of Razorpay and Server
exports.verifySignature = async (req, res) => {
  const webhookSecret = "12345678"; //our secret key stored at server.
  const signature = req.headers["x-razorpay-signature"]; //key sent by razorpay present in this.
  const shasum = crypto.createhmac("sha256", webhookSecret);
  //createhmac fxn take two parameter (i)hashing algorithmn (ii)secret key
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (signature === digest) {
    console.log("Payment is Authorized");
    const { courseId, userId } = req.body.payload.payment.entity.notes;

    try {
      //find the course and enroll student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        {
          $push: {
            studentsEnrolled: userId,
          },
        },
        { new: true }
      );
      if (!enrolledCourse) {
        return res.status(500).json({
          success: false,
          message: "Course not found , Error while registering student",
        });
      }
      console.log(enrolledCourse);

      // find student and add course to enrolled course of a student.

      const enrolledStudent = await User.findOneAndUpdate(
        { _id: userId },
        {
          $push: {
            courses: courseId,
          },
        },
        { new: true }
      );
      console.log(enrolledStudent);

      //send mail to student On Successful course registration (Confirmation mail)

      const emailResponse = await mailSender(
        enrolledStudent.email,
        "Congo",
        "Congo for Course"
      );
      console.log(emailResponse);
      return res.status(200).json({
        success: true,
        message: "Signature Verified and Course Added.",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid request, Signature not match",
    });
  }
};
