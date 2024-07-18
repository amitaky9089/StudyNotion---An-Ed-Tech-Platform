const Category = require("../models/Category");

//handler function for tag creation.
exports.createCategory = async (req, res) => {
  try {
    //data fetching
    const { name, description } = req.body;
    //validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
    //create entry in database
    const CategoryDetails = await Category.create({
      name: name,
      description: description,
    });
    console.log(CategoryDetails);
    //return response
    return res.status(200).json({
      success: true,
      message: "Category created Successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in creating Category.",
    });
  }
};

//handler functions for getting all Category.
exports.showAllCategories = async (req, res) => {
  try {
    const allCategorys = await Category.find(
      {},
      { name: true, description: true }
      //if we will mark any property to true then we will see that property in response.
    );
    return res.status(200).json({
      success: true,
      message: "All Category fetched successfully.",
      data:allCategorys,
    });
  } catch (error) {
    console.log("Error while fetching all Categories ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching all Categories.",
      error:error.message,
    });
  }
};

//category Pagedetails
exports.categoryPageDetails = async (req, res) => {
  try {
    //fetching category detail
    const { categoryId } = req.body;
    //finding course with specified category
    const selectedCategory = await Category.findById(categoryId)
      .populate("courses")
      .exec();
    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category Data not found",
      });
    }
    // Handle the case when there are no courses
		if (selectedCategory.courses.length === 0) {
			console.log("No courses found for the selected category.");
			return res.status(404).json({
				success: false,
				message: "No courses found for the selected category.",
			});
		}
    const selectedCourses = selectedCategory.courses;
    //get courses for other categories
    const categoriesExceptSelected = await Category.findById({
      _id: { $ne: categoryId },
    })
    .populate("courses")
    .exec();
    let differentCourses = [];
		for (const category of categoriesExceptSelected) {
			differentCourses.push(...category.courses);
		}
    // Get top-selling courses across all categories
		const allCategories = await Category.find().populate("courses");
		const allCourses = allCategories.flatMap((category) => category.courses);
    //The .flatMap() method is used to transform each category into an array of its courses
		const mostSellingCourses = allCourses
			.sort((a, b) => b.sold - a.sold)
			.slice(0, 10);

    return res.status(200).json({
      success: true,
      selectedCourses: selectedCourses,
			differentCourses: differentCourses,
			mostSellingCourses: mostSellingCourses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while showing all courses, Intenal Server Error",
      error:error.message,
    });
  }
};
