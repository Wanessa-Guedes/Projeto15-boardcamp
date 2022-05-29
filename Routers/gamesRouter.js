import { getGames, postGames } from "../Controllers/gamesController.js";
import validatePostGamesSchema from "../Middlewares/postGamesSchemaValidate.js";
import { Router } from "express";

const gamesRouter = Router();

gamesRouter.get("/games", getGames);
gamesRouter.post("/games", validatePostGamesSchema, postGames);

export default gamesRouter;