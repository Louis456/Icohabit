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

// String used through the website
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
                    res.render('todolist.html', {
                        IdButtonText: tools.idButton(req, ID_BUTTON_TEXT),
                        groupName: req.session.team_name,
                        todoList: todoList,
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
            filterPassedEvents(req, res, dbo);
            dbo.collection('groupes').findOne({ "_id": Number(req.session.team_ID) }, function (err, groupe) {
                res.render('planning.html', {
                    IdButtonText: tools.idButton(req, ID_BUTTON_TEXT),
                    groupName: req.session.team_name,
                    names: groupe.members
                });
            });

        } else {
            res.redirect('/');
        }
    })

    // Expenses page
    app.get('/depenses', (req, res) => {
        if (tools.isConnected(req)) {
            //dbo.collection('groupes').findOne({"_id": Number(req.session.team_ID)}, function (err, groupe) {
            res.render('expenses.html', {
                IdButtonText: tools.idButton(req, ID_BUTTON_TEXT),
                groupName: req.session.team_name,
                //names: groupe.members
            });
            //});
        } else {
            res.redirect('/');
        }
    })




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
        addTask(req, res, dbo);
    })
    app.post('/checkTask', function (req, res) {
        checkTask(req, res, dbo);
    })
    app.post('/deleteTask', function (req, res) {
        deleteTaskTodo(req, res, dbo);
    })
    app.post('/deleteTaskDone', function (req, res) {
        deleteTaskDone(req, res, dbo);
    })


    app.post('/addEvent', function (req, res) {
        addEvent(req, res, dbo);
    })




    https.createServer({
        key: fs.readFileSync('./key.pem'),
        cert: fs.readFileSync('./cert.pem'),
        passphrase: 'm?TbBenEV2v1)vYDf!pJ'
    }, app).listen(8080);
    app.use(express.static('static'));
});



/*-------------------------------------
 *            Les Fonctions
 *-------------------------------------*/

function filterPassedEvents(req, res, dbo) {
    dbo.collection('planning').findOne({ "groupe": req.session.team_ID }, function (err, planning) {
        if (err) throw err;
        events = planning.eventsToCome;
        console.log(events);
        console.log(events[0]);
        console.log(events[0].date);
    });
}

function addEvent(req, res, dbo) {
    dbo.collection('planning').findOne({ "groupe": req.session.team_ID }, function (err, planning) {
        if (planning === null) {
            dbo.collection('planning').insertOne({
                "groupe": req.session.team_ID,
                "eventsToCome_id": 0,
                "eventsPassed_id": 0,
                "eventsToCome": [{ "date": req.body.date, "participants": req.body.participants, "event": req.body.event, "_id": 0 }],
                "eventsPassed": []
            }, function (err, _) {
                dbo.collection('planning').updateOne(
                    { "groupe": req.session.team_ID },
                    {
                        $inc: { "eventsToCome_id": 1 }
                    }, function (err, _) {
                        if (err) throw err;
                        res.redirect('/planning');
                    }
                );
            });
        } else {
            dbo.collection('planning').updateOne(
                { "groupe": req.session.team_ID },
                {
                    $addToSet: { "eventsToCome": { "date": req.body.date, "participants": req.body.participants, "event": req.body.event, "_id": planning.eventsToCome_id } },
                    $inc: { "eventsToCome_id": 1 }
                }, function (err, _) {
                    if (err) throw err;
                    res.redirect('/planning');
                }
            );
        }
    });
}

function addTask(req, res, dbo) {
    dbo.collection('todo').findOne({ "groupe": req.session.team_ID }, function (err, todoList) {
        if (todoList === null) {
            dbo.collection('todo').insertOne({
                "groupe": req.session.team_ID,
                "taskTodo_id": 0,
                "taskDone_id": 0,
                "tasksTodo": [{ "date": req.body.date, "tasks": [{ "accountant": req.body.accountant, "task": req.body.task, "_id": 0 }] }],
                "tasksDone": []
            }, function (err, _) {
                dbo.collection('todo').updateOne(
                    { "groupe": req.session.team_ID },
                    {
                        $inc: { "taskTodo_id": 1 }
                    }, function (err, _) {
                        if (err) throw err;
                        res.redirect('/todolist');
                    }
                );
            });
        } else {
            dbo.collection('todo').findOne({ "groupe": req.session.team_ID, "tasksTodo.date": req.body.date }, function (err, todoContainingDate) {
                if (todoContainingDate === null) {
                    dbo.collection('todo').updateOne(
                        { "groupe": req.session.team_ID },
                        {
                            $push: { "tasksTodo": { "date": req.body.date, "tasks": [{ "accountant": req.body.accountant, "task": req.body.task, "_id": todoList.taskTodo_id }] } },
                            $inc: { "taskTodo_id": 1 }
                        }, function (err, _) {
                            if (err) throw err;
                            res.redirect('/todolist');
                        }
                    );
                } else {
                    dbo.collection('todo').updateOne(
                        { "groupe": req.session.team_ID, "tasksTodo.date": req.body.date },
                        {
                            $push: { "tasksTodo.$.tasks": { "accountant": req.body.accountant, "task": req.body.task, "_id": todoList.taskTodo_id } },
                            $inc: { "taskTodo_id": 1 }
                        }, function (err, _) {
                            if (err) throw err;
                            res.redirect('/todolist');
                        }
                    );
                }
            });
        }
    });
}

function deleteTaskTodo(req, res, dbo) {
    dbo.collection('todo').updateOne(
        { "groupe": req.session.team_ID, "tasksTodo.date": req.body.date },
        {
            $pull: { "tasksTodo.$.tasks": { "_id": Number(req.body.task_id) } }
        }, function (err, _) {
            console.log('salut');
            dbo.collection('todo').updateOne(
                { "groupe": req.session.team_ID, "tasksTodo.tasks": [] },
                {
                    $pull: { "tasksTodo": { "date": req.body.date } }
                }, function (err, _) {
                    if (err) throw err;
                    console.log('coucou')
                    res.redirect('/todolist')
                }
            )
        }
    );
}

function deleteTaskDone(req, res, dbo) {
    dbo.collection('todo').updateOne(
        { "groupe": req.session.team_ID, "tasksDone.date": req.body.date },
        {
            $pull: { "tasksDone.$.tasks": { "_id": Number(req.body.task_id) } }
        }, function (err, _) {
            console.log('salut');
            dbo.collection('todo').updateOne(
                { "groupe": req.session.team_ID, "tasksDone.tasks": [] },
                {
                    $pull: { "tasksDone": { "date": req.body.date } }
                }, function (err, _) {
                    if (err) throw err;
                    console.log('coucou')
                    res.redirect('/todolist')
                }
            )
        }
    );
}

function checkTask(req, res, dbo) {
    dbo.collection('todo').findOne({ "groupe": req.session.team_ID, "tasksDone.date": req.body.date }, function (err, doneContainingDate) {
        console.log(doneContainingDate);
        if (doneContainingDate === null) {
            console.log('cacou')
            dbo.collection('todo').updateOne(
                { "groupe": req.session.team_ID },
                {
                    $push: { "tasksDone": { "date": req.body.date, "tasks": [{ "accountant": req.body.accountant, "task": req.body.task, "_id": Number(req.body.task_id) }] } }
                }
            );
        } else {
            console.log('caca')
            dbo.collection('todo').updateOne(
                { "groupe": req.session.team_ID, "tasksDone.date": req.body.date },
                { $push: { "tasksDone.$.tasks": { "accountant": req.body.accountant, "task": req.body.task, "_id": Number(req.body.task_id) } } }
            );
        }
        dbo.collection('todo').updateOne(
            { "groupe": req.session.team_ID, "tasksTodo.date": req.body.date },
            {
                $pull: { "tasksTodo.$.tasks": { "_id": Number(req.body.task_id) } }
            }, function (err, result) {
                console.log('salut');
                dbo.collection('todo').updateOne(
                    { "groupe": req.session.team_ID, "tasksTodo.tasks": [] },
                    {
                        $pull: { "tasksTodo": { "date": req.body.date } }
                    }, function (err, _) {
                        if (err) throw err;
                        console.log('coucou')
                        res.redirect('/todolist')
                    }

                )
            }
        );
    });

}


function balance(expenses) {
    /**
     * Take the expenses as inputs and returns the transactions that should be done for everyone to get their money back.
     *
     * @param {list} expenses : List of lists of expenses.
     * Example: [["Louis", 5, ["Simon", "Maxime", "Louis"]], [...]]      --> 5€ paid by Louis for Simon, Maxime and Louis.
     *
     * @return {list}   A list of lists representing who owes how much to whom.
     * Example: [["Louis", 5, "Simon"], ["Louis", 10, "Maxime"]]   --> Louis owes 5€ to Simon and Louis owes 10€ to Maxime.
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
