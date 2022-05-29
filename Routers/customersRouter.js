import {getCustomers, getCustomersById, postCustomers, putCustomers} from ".././Controllers/customersController.js";
import { Router } from "express";

const customerRouter = Router();

customerRouter.get("/customers", getCustomers);
customerRouter.get("/customers/:id", getCustomersById);
customerRouter.post("/customers", postCustomers);
customerRouter.put("/customers/:id", putCustomers);

export default customerRouter;