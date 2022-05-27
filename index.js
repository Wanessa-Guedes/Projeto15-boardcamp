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
    const name = req.query.name;
    let gameFilter = [];
    try {
        const games = await connection.query("SELECT * FROM games");
        if(name){
            let game = new RegExp(`^${name}`);
            for(let i = 0; i < games.length; i++){
                if(game.test(games.rows[i].name)){
                    gameFilter.push(games.rows[i]);
                }
            }
            res.status(200).send(gameFilter)}
        else {
            res.sendStatus(200).send(games.rows)
        }
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

    try {
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
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
})

//TODO: CRUD de Cliente

app.get('/customers', async (req,res) => {
    //TODO: Regra de negócios
    //- Caso seja passado um parâmetro `cpf` na **query string** da requisição, os clientes devem ser filtrados para retornar somente os com CPF que comecem com a string passada. Exemplo:
    //- Para a rota `/customers?cpf=012`, deve ser retornado uma array somente com os clientes que o CPF comece com "012", como "01234567890", "01221001200", etc
    const cpf = req.query.cpf;
    let cpfFilter = [];
    try {
        const customers = await connection.query(`SELECT * FROM customers`);
        if(cpf){
            let cpfs = new RegExp(`^${cpf}`);
            for(let i = 0; i < customers.length; i++){
                if(cpfs.test(customers.rows[i].cpf)){
                    cpfFilter.push(customers.rows[i]);
                }
            }
            res.status(200).send(cpfFilter)} 
        else {
            res.status(200).send(customers.rows)
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
})

app.get('/customers/:id', async (req,res) => {

    try{
    
    const {id} = parseInt(req.params);
    if(isNaN(id)){
        return res.status(400).send(`Dado inválido`);
    }
    const customerIndividual = await connection.query(`SELECT * FROM customers WHERE id = $1`, [id]);
    if(!customerIndividual) return res.status(404).send(`Usuário não encontrado.`);
    res.status(200).send(customerIndividual.rows);
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
})

app.post('/customers', async (req,res) => {
    //TODO: - `cpf` deve ser uma string com 11 caracteres numéricos; 
    //`phone` deve ser uma string com 10 ou 11 caracteres numéricos; 
    //`name` não pode ser uma string vazia; 
    //`birthday` deve ser uma data válida; ⇒ nesses casos, deve retornar **status 400**

    const schema = Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().pattern(new RegExp('^[0-9]{10,11}$')).required(),
        cpf: Joi.string().pattern(new RegExp('^[0-9]{11}$')).required(),
        birthday: Joi.date().format('DD-MM-YYYY').required(),
    })
    const { error, value } = schema.validate(req.body, {abortEarly: false});
        
    if(error){
        return res.status(422).send(error.details.map(detail => detail.message));
    }

    try {
    //- `cpf` não pode ser de um cliente já existente; ⇒ nesse caso deve retornar **status 409**
        const cpfExist = await connection.query(`SELECT * FROM customers WHERE cpf=$1`, [value.cpf]);
        if(cpfExist.rows.length !== 0){
            return res.status(409).send('CPF já cadastrado.');
        }

        await connection.query(`INSERT INTO customers (name, phone, cpf, birthday) 
                                VALUES ($1, $2, $3, $4)`, [value.name, value.phone, value.cpf, value.birthday]);
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
})

app.put('/customers/:id', async (req,res) => {
    //TODO: Regras de negócio:
    //- `cpf` deve ser uma string com 11 caracteres numéricos; 
    //`phone` deve ser uma string com 10 ou 11 caracteres numéricos; 
    //`name` não pode ser uma string vazia; 
    //`birthday` deve ser uma data válida ⇒ nesses casos, deve retornar **status 400**

    const schema = Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().pattern(new RegExp('^[0-9]{10,11}$')).required(),
        cpf: Joi.string().pattern(new RegExp('^[0-9]{11}$')).required(),
        birthday: Joi.date().format('DD-MM-YYYY').required(),
    })
    const { error, value } = schema.validate(req.body, {abortEarly: false});
        
    if(error){
        return res.status(422).send(error.details.map(detail => detail.message));
    }

    try {
        const {id} = parseInt(req.params);
        if(isNaN(id)){
            return res.status(400).send(`Dado inválido`);
        }
    //- `cpf` não pode ser de um cliente já existente; ⇒ nesse caso deve retornar **status 409**
        const cpfExist = await connection.query(`SELECT * FROM customers WHERE cpf=$1`, [value.cpf]);
        if(cpfExist.rows.length !== 0){
            return res.status(409).send('CPF já cadastrado.');
        }

        await connection.query(`UPDATE customers SET name=$1, phone=$2, cpf=$3, birthday=$4 WHERE id=$5`, 
                                [value.name, value.phone, value.cpf, value.birthday, id]);
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
})

// subindo back-end
const PORTA = process.env.PORTA || 4000;
app.listen(PORTA, () => {
    console.log(`Back-end on na porta ${PORTA}`);
});