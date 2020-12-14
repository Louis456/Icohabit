var todolist = require('./todolist');
var planning = require('./planning');
var expenses = require('./expenses');
var tools = require('./tools');

module.exports = {


    searchGroup: function (req, res, dbo) {
        /**
         *
         */
        dbo.collection('users').findOne({ "username": req.session.username }, function (err, userDoc) {
            if (err) throw err;
            let groupIds = userDoc.groupes;
            dbo.collection('groupes').find({ "_id": { $in: groupIds } }).toArray(function (err, userGroups) {
                if (err) throw err;
                let queries = getQueries(req.body.groupTextSearch);
                if (queries[0].length > 0) {

                    let result = applySearching(queries, userGroups, ["_id"], ["groupname"]);
                    if (result.length > 0) {
                        res.render('groupes.html', {
                            IdButtonText: req.session.username,
                            displayErrorJoin: "display:none",
                            badIdJoinMsg: "",
                            displayErrorLeave: "display:none",
                            badIdLeaveMsg: "",
                            groupes: result
                        });
                    } else {
                        res.render('emptySearchGroup.html', {
                            IdButtonText: req.session.username,
                            searchQuery: queries,
                            displayErrorJoin: "display:none",
                            badIdJoinMsg: "",
                            displayErrorLeave: "display:none",
                            badIdLeaveMsg: "",
                            groupes: userGroups
                        });
                    }
                } else {
                    res.redirect('/groupes')
                }
            });
        });
    },


    searchTodo: function (req, res, dbo) {
        /**
         *
         */
        dbo.collection('todo').findOne({ "groupe": req.session.team_ID }, function (err, groupTodo) {
            if (err) throw err;
            let queries = getQueries(req.body.todoTextSearch);
            if (groupTodo != null) {
                let tasks = groupTodo.tasks;
                if (queries[0].length > 0) {
                    let result = applySearching(queries, tasks, ["date"], ["task", "accountant"]);
                    if (result.length > 0) {
                        dbo.collection('groupes').findOne({ "_id": Number(req.session.team_ID) }, function (err, groupe) {
                            if (err) throw err;
                            let today = new Date();
                            tasksTodo = tools.sortByDate(todolist.gatherTodolistByDate(result, false));
                            tasksDone = tools.sortByDate(todolist.gatherTodolistByDate(result, true), true);
                            res.render('todolist.html', {
                                IdButtonText: req.session.username,
                                groupName: req.session.team_name,
                                tasksTodo: tasksTodo,
                                tasksDone: tasksDone,
                                minDate: today.toISOString().substring(0, 10),
                                names: groupe.members
                            });
                        });
                    } else {
                        renderEmptyTools(req, res, queries);
                    }
                } else {
                    res.redirect('/todolist')
                }
            } else {
                renderEmptyTools(req, res, queries);
            }
        });
    },


    searchPlanning: function (req, res, dbo) {
        /**
         *
         */
        dbo.collection('planning').findOne({ "groupe": req.session.team_ID }, function (err, groupPlanning) {
            if (err) throw err;
            let queries = getQueries(req.body.planningTextSearch);
            if (groupPlanning != null) {
                let events = groupPlanning.events;
                if (queries[0].length > 0) {
                    let result = applySearching(queries, events, ["date"], ["event", "participants"]);
                    if (result.length > 0) {
                        dbo.collection('groupes').findOne({ "_id": Number(req.session.team_ID) }, function (err, groupe) {
                            if (err) throw err;
                            let today = new Date();
                            pastEvents = tools.sortByDate(planning.gatherPlanningByDate(result, false), true);
                            futureEvents = tools.sortByDate(planning.gatherPlanningByDate(result, true));
                            res.render('planning.html', {
                                IdButtonText: req.session.username,
                                groupName: req.session.team_name,
                                minDate: today.toISOString().substring(0, 10),
                                names: groupe.members,
                                pastEvents: pastEvents,
                                futureEvents: futureEvents
                            });
                        });
                    } else {
                        renderEmptyTools(req, res, queries)
                    }
                } else {
                    res.redirect('/planning')
                }
            } else {
                renderEmptyTools(req, res, queries)
            }
        });
    },


    searchExpenses: function (req, res, dbo) {
        /**
         *
         */
        dbo.collection('expenses').findOne({ "groupe": req.session.team_ID }, function (err, groupExpenses) {
            if (err) throw err;
            let queries = getQueries(req.body.expensesTextSearch);
            if (groupExpenses != null) {
                if (queries[0].length > 0) {
                    let result = applySearching(queries, groupExpenses.expensesArray, ["amount", "date"], ["title", "payeur", "receveurs"]);
                    if (result.length > 0) {
                        dbo.collection('groupes').findOne({ "_id": Number(req.session.team_ID) }, function (err, groupe) {
                            if (err) throw err;
                            sortedExpenses = tools.sortByDate(expenses.gatherExpensesByDate(result), true);
                            res.render('expenses.html', {
                                IdButtonText: req.session.username,
                                groupName: req.session.team_name,
                                expenses: sortedExpenses,
                                accounts: [],
                                refunds: [],
                                names: groupe.members
                            });
                        });
                    } else {
                        renderEmptyTools(req, res, queries)
                    }
                } else {
                    res.redirect('/depenses')
                }
            } else {
                renderEmptyTools(req, res, queries)
            }
        });
    }

};


function applySearching(queries, arrayOfDicts, exactKeys, inexactKeys) {
    /**
     * Search for exact values and inexact values from user's queries through an array of documents from the database
     * and return an array of the corresponding documents.
     *
     * @param {array} queries : An array of the queries obtained with getQueries() function.
     *
     * @param {array} arrayOfDicts : An array of dictionnaries/documents from the database.
     * Example: [{"_id" : 1, "name": "monGroupe", "password" : "aSd5zdsu", ...}, {...}, ...]
     * Another example: [{"date" : "2020-12-10", "accountant": "michel", "task" : "Faire des courses", ...}, {...}, ...]
     *
     * @param {array} exactKeys : An array of string containing the keys to search in. Here the user input should be exact.
     * Example: ["_id", "date", ...]
     *
     * @param {array} inexactKeys : An array of string containing the keys to search in. Here the user input can contains
     *                              mistakes but their input should be at least of 3 characters.
     * Example: ["name", "task", "accountant", ...]
     *
     *
     * @return {array} : Return an array of dictionnaries/documents that are the results of the search.
     * Example: if exactKeys = ["_id"] or inexactKeys = ["name"] or both
     *          and user's input = "1" or "monGroupe" or "monGrops" or "1 monGrupoe" or even "useless word 1 pp tt"
     *          Returned array will be:
     *          [{"_id" : 1, "name": "monGroupe", "password" : "aSd5zdsu", ...}]
     */
    let result = [];

    for (query of queries) {
        // Search for exact values
        for (key of exactKeys) {
            for (dict of arrayOfDicts) {
                if (dict[key].toString().toLowerCase() === query && !result.includes(dict)) {
                    result.push(dict);
                // Search by date accept month/day or year if not the entire date is written.
                } else if (key === "date") {
                    let dayAndMonth = dict["date"].toString().substring(0, 5);
                    let day = dict["date"].toString().substring(0, 2);
                    let month = dict["date"].toString().substring(2, 5);
                    let year = dict["date"].toString().substring(6, 10);
                    // If nothing found then Search by 'day/month'
                    if ((dayAndMonth === query) && !result.includes(dict)) {
                        result.push(dict);
                    // If still nothing found then Search by day or month or year
                    } else if ((day === query || month === query || year === query) && !result.includes(dict)) {
                        result.push(dict);
                    }

                }
            }
        }
        // Search for inexact values with min 3 characters
        let min3chars = query.length - 2;
        for (var i = 0; i < min3chars; i++) {
            for (var j = 0; j < i + 1; j++) {
                for (dict of arrayOfDicts) {
                    for (key of inexactKeys) {
                        let value = dict[key].toString().toLowerCase();
                        if (value.includes(query.substring(j, query.length - i + j)) && !result.includes(dict)) {
                            result.push(dict);
                        }
                    }
                }
            }
        }
    }
    return result;
}


function getQueries(userInput) {
    /**
     * Transform the string of the user input into an array by splitting " ", "," or ";"
     * Example: "team rocket, groupe; hello " --> ["team", "rocket", "groupe", "hello"]
     *
     * @param {string} userInput : the string contained in the req.body of the search bar.
     *
     * @return {array} : Array with user's queries
     */
    return userInput.toLowerCase()
        .split(',').join(' ')
        .split(';').join(' ')
        .replace(/  +/g, ' ').trim()
        .split(' ');

}


function renderEmptyTools(req, res, queries) {
    /**
     * Render the empty search html page for the 3 tools page (todolist, planning, expenses).
     *
     * @param {array} queries : An array containing the queries of the user's input.
     * Example: ["michel", "scouts"]
     */
    res.render('emptySearchTools.html', {
        IdButtonText: req.session.username,
        groupName: req.session.team_name,
        searchQuery: queries
    });
}
