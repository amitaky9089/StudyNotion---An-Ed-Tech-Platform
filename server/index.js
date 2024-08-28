const express=require("express");
const app=express();

//fetching user routes
const userRoutes=require("./routes/User");
//fetching profile routes
const profileRoutes=require("./routes/Profile");
//fetching course routes
const courseRoutes=require("./routes/Course");
//fetching payment routes
const paymentRoutes=require("./routes/Payment");
//contact us Route
const contactUsRoute = require("./routes/Contact");
//importing for db connection
const database=require("./config/database");
//middleware for cookie
const cookieParser=require("cookie-parser");
//so that backend can entertain frontend request as both are on different server port no.
const cors=require("cors");
//function to cloudinary connection 
const {cloudinaryConnect}=require("./config/cloudinary");
//middleware for uploading files.
const fileUpload=require("express-fileupload");
const dotenv=require("dotenv");
dotenv.config();
const PORT=process.env.PORT || 4000;
//building connection with database
database.connect();
//setting up middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin:"http://localhost:3000",
        // origin:"*",
        credentials:true,
        //Crendentials is essential when you need to exchange credentials (like cookies) between different sites during cross-origin requests
    })
)
app.use(
    fileUpload({
        useTempFiles:true,
        tempFileDir:"/tmp/"
    })
)
//cloudinary connect
cloudinaryConnect();
//routes
app.use("/api/v1/auth",userRoutes);
app.use("/api/v1/profile",profileRoutes);
app.use("/api/v1/course",courseRoutes);
app.use("/api/v1/payment",paymentRoutes); 
app.use("/api/v1/reach", contactUsRoute);
//default route
app.get("/",(req,res)=>{
    return res.json({
        success:true,
        message:"Your server is Up and Running..."
    })
})
//activate our server
app.listen(PORT,()=>{
    console.log(`App is running successfully at ${PORT} PORT.`)
})

//npm run dev