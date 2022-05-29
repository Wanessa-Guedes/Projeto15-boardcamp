import Joi from "joi";

const postCategoriesSchema = Joi.object({
    name: Joi.string().required()
});

export default postCategoriesSchema;