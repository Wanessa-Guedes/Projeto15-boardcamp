import postCategoriesSchema from "../schemas/postCategoriesSchema.js";

export default function postCategoriesValidate(req,res,next){
    const name = req.body;
    const { error, value } = postCategoriesSchema.validate(name, {abortEarly: false});
    if(error){
        return res.status(400).send(error.details.map(detail => detail.message));
    }
    next();
}