import { getGames, postGames } from "../Controllers/gamesController.js";
import { Router } from "express";

const gamesRouter = Router();

gamesRouter.get("/games", getGames);
gamesRouter.post("/games", postGames);

export default gamesRouter;