import postGamesSchema from "../schemas/postGamesSchema.js";

export default function validatePostGamesSchema(req,res,next){
    const { error, value } = postGamesSchema.validate(req.body, {abortEarly: false});
        
    if(error){
        return res.status(400).send(error.details.map(detail => detail.message));
    }
    next();
}