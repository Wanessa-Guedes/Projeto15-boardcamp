import customersSchema from "../schemas/customersSchema.js";

export default function customerSchemaValidate(req,res,next){

    const { error, value } = customersSchema.validate(req.body, {abortEarly: false});
        
    if(error){
    return res.status(400).send(error.details.map(detail => detail.message));
    }

    next();
}