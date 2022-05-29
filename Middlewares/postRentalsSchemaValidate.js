import postRentalSchema from "../schemas/postRentalsSchema.js";

export default function validatePostRentalSchema(req,res,next){
    const rentalInfo = req.body;
    let rentalDays = {
        daysRented: rentalInfo.daysRented
    }
    const { error, value } = postRentalSchema.validate(rentalDays, {abortEarly: false});
        
    if(error){
        return res.status(400).send(error.details.map(detail => detail.message));
    }

    next();
}