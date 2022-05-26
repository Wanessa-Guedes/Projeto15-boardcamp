import express, {json} from "express";
import cors from "cors";
import connection from "./database.js";
import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const app = express();
app.use(json());
app.use(cors());

//TODO: CRUD de Categorias [Create|Read]
//TODO: Rota get de categorias

app.get("/categories", async (req,res) => {

    try{
        const  categorias = await connection.query("SELECT * FROM categories");
        //console.log("categorias do banco", categorias.rows);
        res.status(200).send(categorias.rows);
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }

});

// TODO: Inserir categoria
app.post("/categories", async (req,res) => {

    const {name} = req.body;

    // TODO: Regras de Negócio 1
    // name: não pode estar vazio ⇒ nesse caso, deve retornar status 400
    const schema = Joi.object({
        name: Joi.string()
        .required(),
    })
    const { error, value } = schema.validate(name, {abortEarly: false});
        
    if(error){
        res.status(422).send(error.details.map(detail => detail.message));
        return;
    }

    try {
        // TODO: Regras de Negócio 2
        // name: não pode ser um nome de categoria já existente ⇒ nesse caso deve retornar status 409
        const  categorias = await connection.query("SELECT * FROM categories");
        let categorieExists = false;
        categorias.rows.map((categoria, i) => {
            categorieExists = categoria.name === value.name;
        })
        if(categorieExists){
            return res.status(409).send('Categoria já cadastrada.');
        } 

        await connection.query(`INSERT INTO categories (name) VALUES ($1)`, [value.name]);
        res.sendStatus(201);
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao inserir a categoria");
    }
})

//TODO: CRUD de Jogos [Create|Read]

app.get("/games", async (req,res) => {
    //TODO: Regras de Negócio
    // Para a rota /games?name=ba, deve ser retornado uma array somente com os jogos que comecem com "ba", como "Banco Imobiliário", "Batalha Naval", etc
    try{
        const  games = await connection.query("SELECT * FROM games");
        console.log("jogos do banco", games.rows);
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter os jogos");
    }
})

app.post('/games', async (req,res) => {
    //TODO: REGRAS DE NEGÓCIO
    //`name` não pode estar vazio;
    //`stockTotal` e `pricePerDay` devem ser maiores que 0; 
    const dataGames = {
        name: req.body.name,
        stockTotal: req.body.stockTotal,
        pricePerDay: req.body.pricePerDay
    }
    const schema = Joi.object({
        name: Joi.string().required(),
        stockTotal: Joi.number().integer().min(1).required(),
        pricePerDay: Joi.number().integer().min(1).required()
    })
    const { error, value } = schema.validate(dataGames, {abortEarly: false});
        
    if(error){
        return res.status(422).send(error.details.map(detail => detail.message));
    }

    //`categoryId` deve ser um id de categoria existente; ⇒ nesses casos, deve retornar **status 400**
    const  categorias = await connection.query("SELECT * FROM categories");
        let categorieExists = false;
        for(let i = 0; i < categorias.rows.length; i++){
            if(categorias.rows[i].id === req.body.categoryId){
                categorieExists = true;
            }
        }
        if(!categorieExists){
            return res.status(400).send('Categoria não existente.');
        }
    //`name` não pode ser um nome de jogo já existente ⇒ nesse caso deve retornar **status 409**
    const  games = await connection.query("SELECT * FROM games");
        let gameExist = false;
        for(let i = 0; i < games.rows.length; i++){
            if(games.rows[i].name === req.body.name){
                gameExist = true;
            }
        }
        if(gameExist){
            return res.status(409).send('Jogo já cadastrado.');
        }

        await connection.query(`INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay")
                                VALUES ($1, $2, $3, $4, $5)`, [value.name, req.body.image, value.stockTotal, req.body.categoryId, value.pricePerDay]);
        res.sendStatus(201);
})

// subindo back-end
const PORTA = process.env.PORTA || 4000;
app.listen(PORTA, () => {
    console.log(`Back-end on na porta ${PORTA}`);
});