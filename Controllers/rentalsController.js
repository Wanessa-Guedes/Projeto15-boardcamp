import connection from ".././database.js";
import Joi from "joi";

import { formatedDate } from "../generateDate.js";

export async function getRentals(req,res){
    // Regras de negócio
    //Para a rota /rentals?customerId=1, deve ser retornado uma array somente com os aluguéis do cliente com id 1
    //Para a rota /rentals?gameId=1, deve ser retornado uma array somente com os aluguéis do jogo com id 1
    const queryCustomerId = req.query.customerId;
    const queryGameId = req.query.gameId;
    try {
        const rentalsInfo = await connection.query(`SELECT rentals.*, customers.id as "idFromCustomer", customers.name as "customerName",
                                                    games.id as "idFromGames", games.name as "gamesNames", games."categoryId", categories.name as "categoryName" FROM 
                                                    rentals JOIN customers ON rentals."customerId" = customers.id
                                                    JOIN games ON rentals."gameId" = games.id 
                                                    JOIN categories ON games."categoryId" = categories.id`)
            if(queryCustomerId || queryGameId){
                let rentalsFilter = [];
            for(let i = 0; i < rentalsInfo.rows.length; i++){
                if(rentalsInfo.rows[i].idFromCustomer == queryCustomerId || rentalsInfo.rows[i].idFromGames == queryGameId){
                    rentalsFilter.push({id: rentalsInfo.rows[i].id,
                        customerId: rentalsInfo.rows[i].customerId,
                        gameId: rentalsInfo.rows[i].gameId,
                        rentDate: rentalsInfo.rows[i].rentDate,
                        daysRented: rentalsInfo.rows[i].daysRented,
                        returnDate: rentalsInfo.rows[i].returnDate, // troca pra uma data quando já devolvido
                        originalPrice: rentalsInfo.rows[i].originalPrice,
                        delayFee: rentalsInfo.rows[i].delayFee,
                        customer: {id: rentalsInfo.rows[i].idFromCustomer,
                            name: rentalsInfo.rows[i].customerName
                        },
                    game:{
                        id: rentalsInfo.rows[i].idFromGames,
                        name: rentalsInfo.rows[i].gamesNames,
                        categoryId: rentalsInfo.rows[i].categoryId,
                        categoryName: rentalsInfo.rows[i].categoryName,
                    } });
                }
            }
            res.status(200).send(rentalsFilter)
        } else {
            let rentalsFinal = [];
            for(let i = 0; i < rentalsInfo.rows.length; i++){
                rentalsFinal.push({id: rentalsInfo.rows[i].id,
                    customerId: rentalsInfo.rows[i].customerId,
                    gameId: rentalsInfo.rows[i].gameId,
                    rentDate: rentalsInfo.rows[i].rentDate,
                    daysRented: rentalsInfo.rows[i].daysRented,
                    returnDate: rentalsInfo.rows[i].returnDate, // troca pra uma data quando já devolvido
                    originalPrice: rentalsInfo.rows[i].originalPrice,
                    delayFee: rentalsInfo.rows[i].delayFee,
                    customer: {id: rentalsInfo.rows[i].idFromCustomer,
                        name: rentalsInfo.rows[i].customerName
                    },
                game:{
                    id: rentalsInfo.rows[i].idFromGames,
                    name: rentalsInfo.rows[i].gamesNames,
                    categoryId: rentalsInfo.rows[i].categoryId,
                    categoryName: rentalsInfo.rows[i].categoryName,
                } });
            }
            res.status(200).send(rentalsFinal)
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
}

export async function postRentals(req,res){
    
    const rentalInfo = req.body;
/*     let rentalDays = {
        daysRented: rentalInfo.daysRented
    } */
    let date = formatedDate(new Date());
    let wasReturned = 0;
    // daysRented deve ser um número maior que 0. Se não, deve responder com status 400
/*     const schema = Joi.object({
        daysRented: Joi.number().integer().min(1).required()
    }) */
/*     const { error, value } = schema.validate(rentalDays, {abortEarly: false});
        
    if(error){
        return res.status(400).send(error.details.map(detail => detail.message));
    } */

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
}

export async function postRentalsReturn(req,res){
    const rentalId = req.params.id;
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
}

export async function deleteRentals(req,res){
        
    const rentalId = req.params.id;
    try{
        // Ao excluir um aluguel, deve verificar se o id fornecido existe. Se não, deve responder com status 404
        const rentalData = await connection.query(`SELECT * FROM rentals WHERE id=$1`, [rentalId]);
        if(rentalData.rows.length === 0){
            return res.sendStatus(404);
        }
        // Ao excluir um aluguel, deve verificar se o aluguel já não está finalizado (ou seja, returnDate já está preenchido). Se estiver, deve responder com status 400
        if(rentalData.rows[0].returnDate !== null){
            return res.sendStatus(400);
        }

        await connection.query(`DELETE FROM rentals WHERE id=$1`, [rentalId]);
        res.sendStatus(200);

    } catch (e) {
    console.log(e);
    res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
}