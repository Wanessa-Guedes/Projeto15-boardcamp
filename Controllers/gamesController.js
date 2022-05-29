import connection from ".././database.js";


export async function getGames(req,res){
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
}

export async function postGames(req,res){

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
                                VALUES ($1, $2, $3, $4, $5)`, [req.body.name, req.body.image, req.body.stockTotal, req.body.categoryId, req.body.pricePerDay]);
        res.sendStatus(201);
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
}