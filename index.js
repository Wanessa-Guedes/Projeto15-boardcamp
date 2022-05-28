import express, {json} from "express";
import cors from "cors";
import connection from "./database.js";
import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const app = express();
app.use(json());
app.use(cors());

// Colocando as datas
function twoDigits(num) {
    return num.toString().padStart(2, '0');
}

function formatedDate(date) {
    return [
        date.getFullYear(),
        twoDigits(date.getMonth() + 1),
        twoDigits(date.getDate())
    ].join('-');
}

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

    const name = req.body;
    // TODO: Regras de Negócio 1
    // name: não pode estar vazio ⇒ nesse caso, deve retornar status 400
    const schema = Joi.object({
        name: Joi.string().required()
    })
    const { error, value } = schema.validate(name, {abortEarly: false});
        
    if(error){
        return res.status(400).send(error.details.map(detail => detail.message));
    }

    try {
        // TODO: Regras de Negócio 2
        // name: não pode ser um nome de categoria já existente ⇒ nesse caso deve retornar status 409
        const  categorias = await connection.query("SELECT * FROM categories");
        let categorieExists = false;
        for(let i = 0; i < categorias.rows.length; i++){
            if(categorias.rows[i].name  === value.name){
                categorieExists = true;
            }
        }
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
        const games = await connection.query(`SELECT games.*, categories.name as "categoryName"
                                                FROM games JOIN categories ON games."categoryId" = categories.id`);
        if(name){
            let game = new RegExp(`^${name.toLowerCase()}`);
            for(let i = 0; i < games.rows.length; i++){
                if(game.test(games.rows[i].name.toLowerCase())){
                    gameFilter.push(games.rows[i]);
                }
            }
            res.status(200).send(gameFilter)}
        else {
            res.status(200).send(games.rows)
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
        image: req.body.image,
        stockTotal: req.body.stockTotal,
        pricePerDay: req.body.pricePerDay
    }
    const schema = Joi.object({
        name: Joi.string().required(),
        image: Joi.string().required(),
        stockTotal: Joi.number().integer().min(1).required(),
        pricePerDay: Joi.number().integer().min(1).required()
    })
    const { error, value } = schema.validate(dataGames, {abortEarly: false});
        
    if(error){
        return res.status(400).send(error.details.map(detail => detail.message));
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
            for(let i = 0; i < customers.rows.length; i++){
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
    
    const id = parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).send(`Dado inválido`);
    }
    const customerIndividual = await connection.query(`SELECT * FROM customers WHERE id = $1`, [id]);
    if(customerIndividual.rows.length === 0) return res.status(404).send(`Usuário não encontrado.`);
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
        birthday: Joi.date().iso().required()
    })
    const { error, value } = schema.validate(req.body, {abortEarly: false});
        
    if(error){
        return res.status(400).send(error.details.map(detail => detail.message));
    }

    try {
    //- `cpf` não pode ser de um cliente já existente; ⇒ nesse caso deve retornar **status 409**
        const cpfExist = await connection.query(`SELECT * FROM customers WHERE cpf=$1`, [value.cpf]);
        if(cpfExist.rows.length !== 0){
            return res.status(409).send('CPF já cadastrado.');
        }

        await connection.query(`INSERT INTO customers (name, phone, cpf, birthday) 
                                VALUES ($1, $2, $3, $4)`, [value.name, value.phone, value.cpf, req.body.birthday]);
        res.sendStatus(201);
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
        birthday: Joi.date().iso().required(),
    })
    const { error, value } = schema.validate(req.body, {abortEarly: false});
        
    if(error){
        return res.status(422).send(error.details.map(detail => detail.message));
    }

    try {
        const id = parseInt(req.params.id);
        if(isNaN(id)){
            return res.status(400).send(`Dado inválido`);
        }
    //- `cpf` não pode ser de um cliente já existente; ⇒ nesse caso deve retornar **status 409**
        const cpfExist = await connection.query(`SELECT * FROM customers WHERE cpf=$1`, [value.cpf]);
        if(cpfExist.rows.length !== 0){
            return res.status(409).send('CPF já cadastrado.');
        }

        await connection.query(`UPDATE customers SET name=$1, phone=$2, cpf=$3, birthday=$4 WHERE id=$5`, 
                                [value.name, value.phone, value.cpf, req.body.birthday, id]);
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
})

// TODO: CRUD de aluguéis

app.get("/rentals", async (req,res) => {
    // Regras de negócio
    //Para a rota /rentals?customerId=1, deve ser retornado uma array somente com os aluguéis do cliente com id 1
    //Para a rota /rentals?gameId=1, deve ser retornado uma array somente com os aluguéis do jogo com id 1
    const queryCustomerId = req.query.customerId;
    const queryGameId = req.query.gameId;
    try {
        const rentalsInfo = await connection.query(`SELECT rentals.*, customers.id, customers.name,
                                                    games.id, games.name, games."categoryId", games.name as "categoryName" FROM 
                                                    rentals JOIN customers ON rentals."customerId" = customers.id
                                                    JOIN games ON rentals."gameId" = games.id`)
        if(queryCustomerId || queryGameId){
            for(let i = 0; i < rentalsInfo.rows.length; i++){
                let rentalsFilter = [];
                if(rentalsInfo.rows[i].customer.id == queryCustomerId || rentalsInfo.rows[i].games.id == queryGameId){
                    rentalsFilter.push(rentalsInfo.rows[i]);
                }
            }
            res.status(200).send(rentalsFilter)
        } else {
            res.status(200).send(rentalsInfo.rows)
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
})

app.post("/rentals", async (req,res) => {

    const rentalInfo = req.body;
    let rentalDays = {
        daysRented: rentalInfo.daysRented
    }
    let date = formatedDate(new Date());
    let wasReturned = 0;
    // daysRented deve ser um número maior que 0. Se não, deve responder com status 400
    const schema = Joi.object({
        daysRented: Joi.number().integer().min(1).required()
    })
    const { error, value } = schema.validate(rentalDays, {abortEarly: false});
        
    if(error){
        return res.status(400).send(error.details.map(detail => detail.message));
    }

    try{
        //Ao inserir um aluguel, deve verificar se gameId se refere a um jogo existente. Se não, deve responder com status 400
        const game = await connection.query(`SELECT * FROM games WHERE id=$1`, [rentalInfo.gameId]);
        if(!game){
            return res.sendStatus(400);
        }
        //Ao inserir um aluguel, deve verificar se customerId se refere a um cliente existente. Se não, deve responder com status 400
        const customer = await connection.query(`SELECT * FROM customers WHERE id=$1`, [rentalInfo.customerId]);
        if(!customer){
            return res.sendStatus(400);
        }
        //Ao inserir um aluguel, deve-se validar que existem jogos disponíveis, ou seja, que não tem alugueis em aberto acima da quantidade de jogos em estoque. Caso contrário, deve retornar status 400
        // stockTotal
        const rentalGame = await connection.query(`SELECT * FROM rentals WHERE "gameId"=$1`, [rentalInfo.gameId]);
        for(let i = 0; i < rentalGame.rows.length; i++){
            if(rentalGame.rows[i].returnDate !== null){
                wasReturned++;
            }
        }
        if(game.rows.length === 0){
            return res.sendStatus(400);
        }else if(game.rows[0].stockTotal <= (rentalGame.rows.length - wasReturned)){
            return res.sendStatus(400);
        }
        // Ao inserir um aluguel, os campos returnDate e delayFee devem sempre começar como null
        // originalPrice: daysRented multiplicado pelo preço por dia do jogo no momento da inserção
        // rentDate: data atual no momento da inserção
        let price = rentalInfo.daysRented*game.rows[0].pricePerDay;
        await connection.query(`INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee")
                                VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
                                [rentalInfo.customerId, rentalInfo.gameId, `${date}`, rentalInfo.daysRented, null, price, null]);
        res.sendStatus(201);

    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
})

app.post("/rentals/:id/return", async (req,res) => {

    const rentalId = req.params.id;
    console.log(rentalId)
    let date = formatedDate(new Date());
    let dateTime = new Date();

    try{
        //Ao retornar um aluguel, deve verificar se o id do aluguel fornecido existe. Se não, deve responder com status 404
        const isRental = await connection.query(`SELECT * FROM rentals WHERE id=$1`, [rentalId]);
        if(isRental.rows.length === 0){
            return res.sendStatus(404);
        }
        
        // Ao retornar um aluguel, deve verificar se o aluguel já não está finalizado. Se estiver, deve responder com status 400
        if(isRental.rows[0].returnDate !== null){
            return res.sendStatus(400);
        } 
        //Ao retornar um aluguel, o campo returnDate deve ser populado com a data atual do momento do retorno
        //Ao retornar um aluguel, o campo delayFee deve ser automaticamente populado com um valor equivalente ao número de dias de atraso vezes o preço por dia do jogo no momento do retorno.
        let timeDiff = Math.abs(isRental.rows[0].rentDate.getTime() - dateTime.getTime());
        let daysDiff = timeDiff/(1000*60*60*24);
        let fee = 0;
        const games = await connection.query(`SELECT * FROM games WHERE id=$1`, [isRental.rows[0].gameId]);
        if(daysDiff > isRental.rows[0].daysRented){
            fee = (daysDiff - isRental.rows[0].daysRented)*(games.rows[0].pricePerDay)
        }
        await connection.query(`UPDATE rentals SET "returnDate"=$1, "delayFee"=$2 WHERE id=$3`, [`${date}`, fee, rentalId]);
        res.sendStatus(200);
        
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
})

app.delete("/rentals/:id", async (req,res) => {
    
    const rentalId = req.query.id;

    try{
        // Ao excluir um aluguel, deve verificar se o id fornecido existe. Se não, deve responder com status 404
        const rentalData = await connection.query(`SELECT * FROM rentals WHERE id=$1`, [rentalId]);
        if(!rentalData){
            res.sendStatus(404);
        }
        // Ao excluir um aluguel, deve verificar se o aluguel já não está finalizado (ou seja, returnDate já está preenchido). Se estiver, deve responder com status 400
        if(rentalData.rows[0].returnDate !== null){
            res.sendStatus(400);
        }

        await connection.query(`DELETE FROM rentals WHERE id=$1`, [rentalId]);
        res.sendStatus(200);

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