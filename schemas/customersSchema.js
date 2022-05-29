import Joi from "joi";

const customersSchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().pattern(new RegExp('^[0-9]{10,11}$')).required(),
    cpf: Joi.string().pattern(new RegExp('^[0-9]{11}$')).required(),
    birthday: Joi.date().iso().required()
})

export default customersSchema;
