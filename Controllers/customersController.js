import connection from ".././database.js";
import Joi from "joi";

export async function getCustomers(req,res){
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
}

export async function getCustomersById(req,res){
    
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
}

export async function postCustomers(req,res){
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
}

export async function putCustomers(req,res){
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
        const cpfExist = await connection.query(`SELECT * FROM customers WHERE cpf=$1 AND id!=$2`, [value.cpf, id]);
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
}