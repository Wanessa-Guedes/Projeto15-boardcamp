import { getRentals, postRentals, postRentalsReturn, deleteRentals } from "../Controllers/rentalsController.js";
import { Router } from "express";

const rentalsRouter = Router();

rentalsRouter.get("/rentals", getRentals);
rentalsRouter.post("/rentals", postRentals);
rentalsRouter.post("/rentals/:id/return", postRentalsReturn);
rentalsRouter.delete("/rentals/:id", deleteRentals);
export default rentalsRouter;