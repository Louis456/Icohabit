var express = require('express');
var app = express();
var consolidate = require('consolidate');
MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;
var session = require('express-session');
var bodyParser = require("body-parser");
var https = require('https');
var fs = require('fs');

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
var search = require('./scripts/search');

// Strings used through the website
const ID_BUTTON_TEXT = "Créez-vous un compte ou connectez-vous à votre compte existant"
const BAD_CREDENTIALS_MSG = "Le nom d'utilisateur et/ou le mot de passe est incorrect."
const USERNAME_ALREADY_EXIST_MSG = "Ce nom d'utilisateur est déjà utilisé. Veuillez en choisir un autre."
const BAD_CREDENTIALS_JOIN_GROUP_MSG = "L'id et/ou le mot de passe est incorrect."
const USER_ALREADY_IN_GROUP_MSG = "Vous faites déjà parti de ce groupe."
const BAD_ID_LEAVE_GROUP_MSG = "Vous n'êtes pas membre du groupe que vous désirez quitter."



MongoClient.connect('mongodb://localhost:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (err, db) => {
    dbo = db.db("testdb");
    if (err) throw err;

    /* ----------------
        GET Methods
    ---------------- */

    // Home page
    app.get('/', (req, res) => {
        if (tools.isConnected(req)) {
            res.redirect('/groupes')
        } else {
            let displayConnect = tools.displayOrNot(req, "login");
            let displayRegister = tools.displayOrNot(req, "register");
            let scroll = "scroll-behavior: smooth";
            // Stop smooth-scrolling if an error has to be displayed.
            if (displayConnect != "display:none" || displayRegister != "display:none") {
                scroll = ""
            }
            res.render('index.html', {
                IdButtonText: ID_BUTTON_TEXT,
                scrollBehavior: scroll,
                displayErrorConnect: displayConnect,
                badCredentialsMsg: BAD_CREDENTIALS_MSG,
                displayErrorRegister: displayRegister,
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
                let joinMessage = BAD_CREDENTIALS_JOIN_GROUP_MSG
                if (req.session.displayAlreadyInGroupError != null) {
                    joinMessage = USER_ALREADY_IN_GROUP_MSG;
                    req.session.displayLeaveGroupError = null;
                }
                res.render('groupes.html', {
                    IdButtonText: req.session.username,
                    displayErrorJoin: tools.displayOrNot(req, "join"),
                    badIdJoinMsg: joinMessage,
                    displayErrorLeave: tools.displayOrNot(req, "leave"),
                    badIdLeaveMsg: BAD_ID_LEAVE_GROUP_MSG,
                    groupes: groupes
                });
            });
            dbo.collection('groupes').findOne({
                "_id": 0
            }, function (err, ids) {
                if (err) throw err;
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
            if (tools.hasChosenGroup(req)) {
                res.render('app.html', {
                    IdButtonText: req.session.username,
                    groupName: req.session.team_name
                });
            } else {
                res.redirect('/groupes');
            }
        } else {
            res.redirect('/');
        }
    });

    // TodoList page
    app.get('/todolist', (req, res) => {
        if (tools.isConnected(req)) {
            if (tools.hasChosenGroup(req)) {
                dbo.collection('groupes').findOne({ "_id": Number(req.session.team_ID) }, function (err, groupe) {
                    if (err) throw err;
                    dbo.collection('todo').findOne({ "groupe": req.session.team_ID }, function (err, todoList) {
                        if (err) throw err;
                        let today = new Date();
                        if (todoList === null) {
                            res.render('todolist.html', {
                                IdButtonText: req.session.username,
                                groupName: req.session.team_name,
                                minDate: today.toISOString().substring(0, 10),
                                names: groupe.members
                            });
                        } else {
                            tasksTodo = tools.sortByDate(todolist.gatherTodolistByDate(todoList.tasks, false));
                            tasksDone = tools.sortByDate(todolist.gatherTodolistByDate(todoList.tasks, true), true);
                            res.render('todolist.html', {
                                IdButtonText: req.session.username,
                                groupName: req.session.team_name,
                                tasksTodo: tasksTodo,
                                tasksDone: tasksDone,
                                minDate: today.toISOString().substring(0, 10),
                                names: groupe.members
                            });
                        }

                    });
                });
            } else {
                res.redirect('/groupes');
            }
        } else {
            res.redirect('/');
        }
    });

    // Planning page
    app.get('/planning', (req, res) => {
        if (tools.isConnected(req)) {
            if (tools.hasChosenGroup(req)) {
                dbo.collection('groupes').findOne({ "_id": Number(req.session.team_ID) }, function (err, groupe) {
                    if (err) throw err;
                    dbo.collection('planning').findOne({ "groupe": req.session.team_ID }, function (err, planningForGivenGroup) {
                        if (err) throw err;
                        let today = new Date();
                        if (planningForGivenGroup === null) {
                            res.render('planning.html', {
                                IdButtonText: req.session.username,
                                groupName: req.session.team_name,
                                minDate: today.toISOString().substring(0, 10),
                                names: groupe.members
                            });
                        } else {
                            pastEvents = tools.sortByDate(planning.gatherPlanningByDate(planningForGivenGroup.events, false), true);
                            futureEvents = tools.sortByDate(planning.gatherPlanningByDate(planningForGivenGroup.events, true));
                            res.render('planning.html', {
                                IdButtonText: req.session.username,
                                groupName: req.session.team_name,
                                minDate: today.toISOString().substring(0, 10),
                                names: groupe.members,
                                pastEvents: pastEvents,
                                futureEvents: futureEvents
                            });
                        }
                    });
                });
            } else {
                res.redirect('/groupes');
            }
        } else {
            res.redirect('/');
        }
    });

    // Expenses page
    app.get('/depenses', (req, res) => {
        if (tools.isConnected(req)) {
            if (tools.hasChosenGroup(req)) {
                dbo.collection('groupes').findOne({ "_id": Number(req.session.team_ID) }, function (err, groupe) {
                    if (err) throw err;
                    dbo.collection('expenses').findOne({ "groupe": req.session.team_ID }, function (err, depenses) {
                        if (err) throw err;
                        if (depenses === null) {
                            res.render('expenses.html', {
                                IdButtonText: req.session.username,
                                groupName: req.session.team_name,
                                names: groupe.members
                            });
                        } else {
                            let cachedData = depenses.cache;
                            sortedExpenses = tools.sortByDate(expenses.gatherExpensesByDate(depenses.expensesArray), true);
                            res.render('expenses.html', {
                                IdButtonText: req.session.username,
                                groupName: req.session.team_name,
                                expenses: sortedExpenses,
                                accounts: cachedData[0],
                                refunds: cachedData[1],
                                names: groupe.members
                            });
                        }
                    })
                });
            } else {
                res.redirect('/groupes');
            }
        } else {
            res.redirect('/');
        }
    });

    app.get('/submitSearchGroup', (req, res) => {
        res.redirect('groupes');
    });
    app.get('/submitSearchTodo', (req, res) => {
        res.redirect('/app');
    });
    app.get('/submitSearchPlanning', (req, res) => {
        res.redirect('/app');
    });
    app.get('/submitSearchExpenses', (req, res) => {
        res.redirect('/app');
    });




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


    app.post('/launchAppPage', function (req, res) {
        tools.launchAppPage(req, res, dbo);
    });


    app.post('/addTask', function (req, res) {
        todolist.addTask(req, res, dbo);
    });
    app.post('/checkTask', function (req, res) {
        todolist.checkTask(req, res, dbo);
    });
    app.post('/deleteTask', function (req, res) {
        todolist.deleteTask(req, res, dbo);
    });


    app.post('/addEvent', function (req, res) {
        planning.addEvent(req, res, dbo);
    });
    app.post('/deleteEvent', function (req, res) {
        planning.deleteEvent(req, res, dbo);
    });


    app.post('/addExpense', function (req, res) {
        expenses.addExpense(req, res, dbo);
    });
    app.post('/deleteExpense', function (req, res) {
        expenses.deleteExpense(req, res, dbo);
    });


    app.post('/submitSearchGroup', function (req, res) {
        search.searchGroup(req, res, dbo);
    });
    app.post('/submitSearchTodo', function (req, res) {
        search.searchTodo(req, res, dbo);
    });
    app.post('/submitSearchPlanning', function (req, res) {
        search.searchPlanning(req, res, dbo);
    });
    app.post('/submitSearchExpenses', function (req, res) {
        search.searchExpenses(req, res, dbo);
    });




    https.createServer({
        key: fs.readFileSync('./key.pem'),
        cert: fs.readFileSync('./cert.pem'),
        passphrase: 'm?TbBenEV2v1)vYDf!pJ'
    }, app).listen(8080);
    app.use(express.static('static'));

});
