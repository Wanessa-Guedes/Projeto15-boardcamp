import express, {json} from "express";
import cors from "cors";
import dotenv from "dotenv";

import categoriesRouter from "./Routers/categoriesRouter.js";
import gamesRouter from "./Routers/gamesRouter.js";
import customerRouter from "./Routers/customersRouter.js";
import rentalsRouter from "./Routers/rentalsRouter.js"

dotenv.config();

const app = express();
app.use(json());
app.use(cors());

app.use(categoriesRouter);

app.use(gamesRouter);

app.use(customerRouter);

app.use(rentalsRouter);

const PORTA = process.env.PORTA || 4000;
app.listen(PORTA, () => {
    console.log(`Back-end on na porta ${PORTA}`);
});