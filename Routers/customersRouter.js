import {getCustomers, getCustomersById, postCustomers, putCustomers} from ".././Controllers/customersController.js";
import customerSchemaValidate from "../Middlewares/customerSchemaValidate.js";
import { Router } from "express";

const customerRouter = Router();

customerRouter.get("/customers", getCustomers);
customerRouter.get("/customers/:id", getCustomersById);
customerRouter.post("/customers",customerSchemaValidate, postCustomers);
customerRouter.put("/customers/:id", customerSchemaValidate, putCustomers);

export default customerRouter;