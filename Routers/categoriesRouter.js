import { getCategories, postCategories } from "../Controllers/categoriesController.js";
import postCategoriesValidate from "../Middlewares/postCategoriesValidate.js";
import { Router } from "express";

const categoriesRouter = Router();

categoriesRouter.get("/categories", getCategories);
categoriesRouter.post("/categories", postCategoriesValidate, postCategories);

export default categoriesRouter;