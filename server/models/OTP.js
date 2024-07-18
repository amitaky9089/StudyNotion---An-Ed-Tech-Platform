const mongoose=require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate=require("../mail/templates/emailVerificationTemplate")
const OTPSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires: 60*5, // The document will be automatically deleted after 5 minutes of its creation time
    }
})

//function to send mail
async function sendVerificationEmail(email,otp){
    try{
        const mailResponse=await mailSender(email,"Verification mail",emailTemplate(otp)); //mailResponse is an object.
        //mailResponse.response return the value of message property of mailResponse object.
        console.log("Email sent Successfully",mailResponse.response);
    }catch(error){
           console.log("Error recieved while sending mail",error);
           throw error;
    }
}

// Define a pre-save hook to send email before the document has been saved
OTPSchema.pre("save",async function(next){
	// Only send an email when a new document is created
	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
    console.log("New document saved to database");
	next();
});

//Exporting OTP schema
const OTP = mongoose.model("OTP", OTPSchema);
module.exports = OTP;