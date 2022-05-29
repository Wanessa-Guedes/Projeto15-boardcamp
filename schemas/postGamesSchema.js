import Joi from "joi";

const postGamesSchema = Joi.object({
    name: Joi.string().required(),
    image: Joi.string().required(),
    stockTotal: Joi.number().integer().min(1).required(),
    categoryId: Joi.number().integer().min(0).required(),
    pricePerDay: Joi.number().integer().min(1).required()
});

export default postGamesSchema;