import Joi from "joi";

const postRentalSchema = Joi.object({
    daysRented: Joi.number().integer().min(1).required()
});

export default postRentalSchema;