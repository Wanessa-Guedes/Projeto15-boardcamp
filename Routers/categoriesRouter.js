import { getCategories, postCategories } from "../Controllers/categoriesController.js";
import { Router } from "express";

const categoriesRouter = Router();

categoriesRouter.get("/categories", getCategories);
categoriesRouter.post("/categories", postCategories);

export default categoriesRouter;