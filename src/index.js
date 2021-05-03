import express, { request, response } from 'express';
import { v4 as uuidv4 } from 'uuid';



const app = express();
app.use(express.json());

const customers = [];

function verifyExistsAccountCPFByParams(request, response, next) {
    const { cpf } = request.params;

    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {

        return response.status(400).json({ error: 'Customer does not exists' });

    }
    request.params.customer = customer;
    return next();
}

function verifyExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;


    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {

        return response.status(400).json({ error: 'Customer does not exists' });

    }
    request.headers.customer = customer;
    return next();
}



function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}





function setBalance(customer, deposit, statementOperation) {
    const amount = customer.statement + deposit;

    const depositAmount = {
        amount: amount
    }

    const newStatament = {
        description: statementOperation.description,
        amount: amount,
        created_at: statementOperation.created_at,
        type: statementOperation.type
    }

    customers.statement = newStatament;

    console.log(newStatament)

    return depositAmount;
}

app.post('/account', (request, response) => {
    const { cpf, name } = request.body;

    const id = uuidv4();

    let cpfExists = false;

    customers.forEach(customer => {
        if (customer.cpf === cpf) {
            return cpfExists = true
        } else {
            return cpfExists = false
        }
    });

    if (cpfExists === true) {
        return response.status(400).json({ message: 'CPF does exists' })
    }

    const customer = {
        id,
        name,
        cpf,
        statement: []
    }

    customers.push(customer);

    return response.status(201).json(customer);
});

app.get('/statement/:cpf', verifyExistsAccountCPFByParams, (request, response) => {
    const { customer } = request.params;

    return response.json(customer.statement);


});

app.post('/deposit', verifyExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;

    const { customer } = request.headers;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    setBalance(customer, amount, statementOperation);

    customer.statement.push(statementOperation);

    return response.status(201).json(statementOperation);
});

app.post('/withdraw', verifyExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request.headers;


    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({ error: "Insuficient funds!" })
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation)

    return response.status(201).send();
});

app.get('/amount/:cpf', verifyExistsAccountCPFByParams, (request, response) => {
    const { customer } = request.params;

    const balance = getBalance(customer.statement);

    return response.json(balance);

});

app.get('/statement/:cpf/date', verifyExistsAccountCPFByParams, (request, response) => {

    const { customer } = request.params;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statements) =>
        statement.created_at.toDateString() === new Date(dateFormat).toDateString());


    return response.json(statement);


});

app.put('/account', verifyExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request.headers;

    customer.name = name;

    return response.status(201).send();
});

app.get('/account', verifyExistsAccountCPF, (request, response) => {
    const { customer } = request.headers

    return response.json(customer)
});

app.delete('/account/:cpf', verifyExistsAccountCPFByParams, (request, response) => {
    const { customer } = request.params;

    customers.splice(customer, 1);

    return response.status(200).json(customers)
})
app.listen(3333, () => {
    console.log('😺Server running!😺');
});