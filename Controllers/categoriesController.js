import connection from ".././database.js";
import Joi from "joi";

export async function getCategories(req,res){
    try{
        const  categorias = await connection.query("SELECT * FROM categories");
        //console.log("categorias do banco", categorias.rows);
        res.status(200).send(categorias.rows);
    } catch (e) {
        console.log(e);
        res.status(500).send("Ocorreu um erro ao obter as categorias");
    }
}

export async function postCategories(req,res){
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
}