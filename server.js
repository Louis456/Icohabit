var express = require('express');
var app = express();
var consolidate = require('consolidate');
MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;
var session = require('express-session');
var bodyParser = require("body-parser");
var https = require('https');
var fs = require('fs');
var bcrypt = require('bcrypt')

app.engine('html', consolidate.hogan);
app.set('views', 'private');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "0CMJAlvbxKHte?GY=}Wl",
    resave: false,
    saveUninitialized: true,
    cookie: {
        path: '/',
        httpOnly: true,
        maxAge: 3600000
    }
}));

const ID_BUTTON_TEXT = "Créez-vous un compte ou connectez-vous à votre compte existant"

MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
    dbo = db.db("database");
    if (err) throw err;

    // Home page
    app.get('/', (req, res) => {
        res.render('index.html', {IdButtonText: idButton(req)});
    });

    // Groups page
    app.get('/groupes', (req, res) => {
        res.render('groupes.html', {IdButtonText: idButton(req)});
    });

    https.createServer({
        key: fs.readFileSync('./key.pem'),
        cert: fs.readFileSync('./cert.pem'),
        passphrase: 'm?TbBenEV2v1)vYDf!pJ'
    }, app).listen(8080);
    app.use(express.static('static'));

});




//            Les Fonctions

function isConnected(req) {
    /**
     * Return a boolean
     * @return True if the user is connected, otherwise false
     */
    return !(req.session.username == null);
}

function idButton(req) {
    /**
     * Return the string to be displayed on the upper right side of the screen.
     * @return The username if the user is connected, else ID_BUTTON_TEXT string.
     */
    if (req.session.username) return req.session.username;
    return ID_BUTTON_TEXT
}

function balance(expenses) {
    /**
     * Take the expenses as inputs and returns the transactions that should be done for everyone to get their money back.
     * 
     * @param {list} expenses : List of lists of expenses.
     * Example: [["Louis", 5, ["Simon", "Maxime", "Louis"]], [...]]      --> 5€ paid by Louis for Simon, Maxime and Louis.
     * 
     * @return {list}   A list of tuples representing who owes how much to whom.
     * Example: [("Louis", 5, "Simon"), ("Louis", 10, "Maxime")]   --> Louis owes 5€ to Simon and Louis owes 10€ to Maxime.
     */
    function addToAccount(person, amount) {
        if (person in accounts) return accounts[person] + amount;
        return amount;
    }
    let accounts = {};
    for (const exp of expenses) {
        accounts[exp[0]] = addToAccount(exp[0], exp[1]);
        for (const person of exp[2]) {
            accounts[person] = addToAccount(person, -exp[1] / exp[2].length);
        }
    }
    let balanceList = [];
    for (const creditor in accounts) {
        if (accounts[creditor] > 0) {
            for (const debtor in accounts) {
                if (accounts[debtor] < 0) {
                    let toRetrieve = Math.round((accounts[creditor] + Number.EPSILON) * 100) / 100;
                    let toGive = Math.round((Math.abs(accounts[debtor]) + Number.EPSILON) * 100) / 100;
                    if (toGive >= toRetrieve) {
                        accounts[creditor] = 0;
                        accounts[debtor] = accounts[debtor] + toRetrieve;
                        balanceList.push([debtor, toRetrieve, creditor]);
                    } else {
                        accounts[creditor] = accounts[creditor] - toGive;
                        accounts[debtor] = 0;
                        balanceList.push([debtor, toGive, creditor]);
                    }
                }
            }
        }
    }
    return balanceList;
}

