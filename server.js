var express = require('express');
var app = express();
var consolidate = require('consolidate');
MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;
var session = require('express-session');
var bodyParser = require("body-parser");
var https = require('https');
var fs = require('fs');
var bcrypt = require('bcrypt');

app.engine('html', consolidate.hogan);
app.set('views', 'private');

app.use(bodyParser.urlencoded({
    extended: true
}));
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


// JavaScript files from ./scripts
var tools = require('./scripts/tools');
var account = require('./scripts/account');
var groups = require('./scripts/groups');
var todolist = require('./scripts/todolist');
var planning = require('./scripts/planning');
var expenses = require('./scripts/expenses');

// Strings used through the website
const ID_BUTTON_TEXT = "Créez-vous un compte ou connectez-vous à votre compte existant"
const BAD_CREDENTIALS_MSG = "Le nom d'utilisateur et/ou le mot de passe est incorrect."
const USERNAME_ALREADY_EXIST_MSG = "Ce nom d'utilisateur est déjà utilisé. Veuillez en choisir un autre."
const BAD_CREDENTIALS_JOIN_GROUP_MSG = "L'id et/ou le mot de passe est incorrect."
const BAD_ID_LEAVE_GROUP_MSG = "Vous n'êtes pas membre du groupe que vous désirez quitter."



MongoClient.connect('mongodb://localhost:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (err, db) => {
    dbo = db.db("database");
    if (err) throw err;

    /* ----------------
        GET Methods
    ---------------- */

    // Home page
    app.get('/', (req, res) => {
        if (tools.isConnected(req)) {
            res.redirect('/groupes')
        } else {
            res.render('index.html', {
                IdButtonText: tools.idButton(req, ID_BUTTON_TEXT),
                displayErrorConnect: tools.displayOrNot(req, "login"),
                badCredentialsMsg: BAD_CREDENTIALS_MSG,
                displayErrorRegister: tools.displayOrNot(req, "register"),
                usernameAlreadyExistMsg: USERNAME_ALREADY_EXIST_MSG
            });
        }
    });

    // Groups page
    app.get('/groupes', (req, res) => {
        if (tools.isConnected(req)) {
            dbo.collection('groupes').find({
                "members": req.session.username
            }).toArray(function (err, groupes) {
                if (err) throw err;
                res.render('groupes.html', {
                    IdButtonText: tools.idButton(req, ID_BUTTON_TEXT),
                    displayErrorJoin: tools.displayOrNot(req, "join"),
                    badIdJoinMsg: BAD_CREDENTIALS_JOIN_GROUP_MSG,
                    displayErrorLeave: tools.displayOrNot(req, "leave"),
                    badIdLeaveMsg: BAD_ID_LEAVE_GROUP_MSG,
                    groupes: groupes
                });
            });
            dbo.collection('groupes').findOne({
                "_id": 0
            }, function (err, ids) {
                // Add the counter if db is empty
                if (ids == null) dbo.collection('groupes').insertOne({ "_id": 0, "idcount": 1 });
            });
            req.session.team_ID = null;
        } else {
            res.redirect('/')
        }

    });

    // App page
    app.get('/app', (req, res) => {
        if (tools.isConnected(req)) {
            res.render('app.html', {
                IdButtonText: tools.idButton(req, ID_BUTTON_TEXT),
                groupName: req.session.team_name
            });
        } else {
            res.redirect('/');
        }
    });

    // TodoList page
    app.get('/todolist', (req, res) => {
        if (tools.isConnected(req)) {
            dbo.collection('groupes').findOne({ "_id": Number(req.session.team_ID) }, function (err, groupe) {
                if (err) throw err;
                dbo.collection('todo').findOne({ "groupe": req.session.team_ID }, function (err, todoList) {
                    if (err) throw err;
                    let today = new Date();
                    res.render('todolist.html', {
                        IdButtonText: tools.idButton(req, ID_BUTTON_TEXT),
                        groupName: req.session.team_name,
                        todoList: todoList,
                        minDate: today.toISOString().substring(0, 10),
                        names: groupe.members
                    });
                });
            });
        } else {
            res.redirect('/');
        }
    });

    // Planning page
    app.get('/planning', (req, res) => {
        if (tools.isConnected(req)) {

            dbo.collection('groupes').findOne({ "_id": Number(req.session.team_ID) }, function (err, groupe) {
                dbo.collection('planning').findOne({"groupe":req.session.team_ID}, function(err, planning){
                    let today = new Date();
                    let events = planning.eventsToCome;
                    filterPassedEvents(today,events,dbo,req)
                    res.render('planning.html', {
                        IdButtonText: tools.idButton(req, ID_BUTTON_TEXT),
                        groupName: req.session.team_name,
                        minDate: today.toISOString().substring(0, 10),
                        names: groupe.members
                    });
                });
            });

        } else {
            res.redirect('/');
        }
    })

    // Expenses page
    app.get('/depenses', (req, res) => {
        if (tools.isConnected(req)) {
            dbo.collection('groupes').findOne({"_id": Number(req.session.team_ID)}, function (err, groupe) {
                if (err) throw err;
                dbo.collection('expenses').findOne({ "groupe": req.session.team_ID }, function (err, depenses) {
                    if (err) throw err;
                    if (depenses === null) {
                        res.render('expenses.html', {
                            IdButtonText: tools.idButton(req, ID_BUTTON_TEXT),
                            groupName: req.session.team_name,
                            names: groupe.members
                        });
                    } else {
                        res.render('expenses.html', {
                            IdButtonText: tools.idButton(req, ID_BUTTON_TEXT),
                            groupName: req.session.team_name,
                            expenses: expenses.listOfExpenses(req, dbo),
                            accounts: expenses.listOfAccounts(req, dbo),
                            refunds: expenses.listOfRefunds(req, dbo),
                            names: groupe.members
                        });
                    }
                })
            });
        } else {
            res.redirect('/');
        }
    })




    /* ----------------
        POST Methods
    ---------------- */


    app.post('/submitRegister', function (req, res) {
        account.register(req, res, dbo);
    });
    app.post('/submitLogIn', function (req, res) {
        account.connect(req, res, dbo);
    });
    app.post('/disconnect', function (req, res) {
        account.disconnect(req, res);
    });


    app.post('/createTeam', function (req, res) {
        groups.createGroup(req, res, dbo);
    });
    app.post('/joinTeam', function (req, res) {
        groups.joinGroup(req, res, dbo);
    });
    app.post('/leaveTeam', function (req, res) {
        groups.leaveGroup(req, res, dbo);
    });


    app.post('/displayTools', function (req, res) {
        req.session.team_ID = req.body.team_ID
        dbo.collection('groupes').findOne({
            "_id": Number(req.body.team_ID)
        }, function (err, group) {
            req.session.team_name = group.groupname;
            res.redirect('/app')
        });
    });


    app.post('/addTask', function (req, res) {
        todolist.addTask(req, res, dbo);
    })
    app.post('/checkTask', function (req, res) {
        todolist.checkTask(req, res, dbo);
    })
    app.post('/deleteTask', function (req, res) {
        todolist.deleteTaskTodo(req, res, dbo);
    })
    app.post('/deleteTaskDone', function (req, res) {
        todolist.deleteTaskDone(req, res, dbo);
    })


    app.post('/addEvent', function (req, res) {
        planning.addEvent(req, res, dbo);
    })


    app.post('/addExpense', function (req, res) {
        expenses.addExpense(req, res, dbo);
    })
    app.post('/deleteExpense', function (req, res) {
        expenses.addExpense(req, res, dbo);
    })
    app.post('/resolveExpenses', function (req, res) {
        expenses.addExpense(req, res, dbo);
    })







    https.createServer({
        key: fs.readFileSync('./key.pem'),
        cert: fs.readFileSync('./cert.pem'),
        passphrase: 'm?TbBenEV2v1)vYDf!pJ'
    }, app).listen(8080);
    app.use(express.static('static'));

});
