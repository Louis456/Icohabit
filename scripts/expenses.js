var tools = require('./tools');

module.exports = {


    addExpense: function (req, res, dbo) {
        /**
         * Add an expense to the database.
         *
         * If the group doesn't already have a document in the database then it creates a new one with an id set to 0.
         * If the group is in the database then it updates group's document to add the new expense to the expensesArray
         * with a new incremented id (useful if we desire to delete it later) and then refresh the page.
         */
        dbo.collection('expenses').findOne({ "groupe": req.session.team_ID }, function (err, expenses) {
            if (err) throw err;
            let receivers = req.body.receveurs;
            if (!(req.body.receveurs instanceof Object)) receivers = [req.body.receveurs];
            if (expenses === null) {
                let expArray = [{ "_id": 0, "title": req.body.expenseTitle, "date": tools.getPrettyDate(req.body.date), "dateGetTime": new Date(req.body.date).getTime(), "amount": req.body.amount, "payeur": req.body.payeur, "receveurs": receivers }];
                let arrayAndDict = listOfAccounts(expArray);
                dbo.collection('expenses').insertOne({
                    "groupe": req.session.team_ID,
                    "expense_id": 1,
                    "expensesArray": expArray,
                    "cache": [arrayAndDict[0], listOfRefunds(arrayAndDict[1])]
                }, function (err, _) {
                    res.redirect('/depenses');
                });
            } else {
                let newArray = expenses.expensesArray.concat([{ "_id": expenses.expense_id, "title": req.body.expenseTitle, "date": tools.getPrettyDate(req.body.date), "dateGetTime": new Date(req.body.date).getTime(), "amount": req.body.amount, "payeur": req.body.payeur, "receveurs": receivers }]);
                let arrayAndDict = listOfAccounts(newArray);
                dbo.collection('expenses').updateOne({ "groupe": req.session.team_ID }, {
                    $set: { "expensesArray": newArray, "cache": [arrayAndDict[0], listOfRefunds(arrayAndDict[1])] },
                    $inc: { "expense_id": 1 }
                }, function (err, _) {
                    if (err) throw err;
                    res.redirect('/depenses');
                });
            }
        });
    },


    deleteExpense: function (req, res, dbo) {
        /**
         * Delete the expense correspondig with the argument from the database and refresh the page.
         */
        dbo.collection('expenses').updateOne({ "groupe": req.session.team_ID }, {
            $pull: { "expensesArray": { "_id": Number(req.body.expense_id) } }
        }, function (err, _) {
            if (err) throw err;
            dbo.collection('expenses').findOne({ "groupe": req.session.team_ID }, function (err, expenses) {
                if (err) throw err;
                let arrayAndDict = listOfAccounts(expenses.expensesArray);
                dbo.collection('expenses').updateOne({ "groupe": req.session.team_ID }, {
                    $set: { "cache": [arrayAndDict[0], listOfRefunds(arrayAndDict[1])] }
                }, function (err, _) {
                    if (err) throw err;
                    res.redirect('/depenses');
                });
            });
        });
    },


    gatherExpensesByDate: function (expensesArray) {
        /**
         * @param {Array} expensesArray : The array containing all the expenses of a group.
         * @return {Array} An array of dictionaries corresponding to the same expenses but grouped by date.
         */
        let groupedByDate = [];
        for (element of expensesArray) {
            if (groupedByDate.length === 0) {
                groupedByDate.push({ "date": element.date, "dateGetTime": element.dateGetTime, "expensesArray": [{ "title": element.title, "amount": element.amount, "receveurs": element.receveurs, "payeur": element.payeur, "_id": element._id }] })
            } else if (groupedByDate.some(each => each.date === element.date)) {
                let idx = groupedByDate.findIndex(each => each.date === element.date);
                groupedByDate[idx].expensesArray.push({ "title": element.title, "amount": element.amount, "receveurs": element.receveurs, "payeur": element.payeur, "_id": element._id })
            } else {
                groupedByDate.push({ "date": element.date, "dateGetTime": element.dateGetTime, "expensesArray": [{ "title": element.title, "amount": element.amount, "receveurs": element.receveurs, "payeur": element.payeur, "_id": element._id }] })
            }
        }
        return groupedByDate;
    }
};



function listOfAccounts(expensesArray) {
    /**
     * Returns a list of people associated with their money (positive or negative).
     *
     * @param {array} expensesArray : The array containing all the expenses of a group.
     *
     * @return {array} An array of 2 items, the accounts in an array(1) and the accounts in a dictionary(2).
     * Example: [
     * 1)   [{ "people": "Louis", "money": "+20" }, { "people": "Simon", "money": "-10" }, { "people": "Fred", "money": "-10" }],
     * 2)   {"Louis" : 20, "Simon": -10, "Fred": -10}
     *          ]
     * --> Louis needs to get 20€ back, Simon has to give 10€ back, same for Fred.
     */
    function addToAccount(person, amount) {
        if (person in accounts) return accounts[person] + amount;
        return amount;
    }
    let accounts = {};
    let result = [];
    for (const dep of expensesArray) {
        let person = dep.payeur;
        let amount = Number(dep.amount);
        accounts[person] = addToAccount(person, amount);
        let dividedAmount = amount / dep.receveurs.length;
        for (const whoGet of dep.receveurs) {
            accounts[whoGet] = addToAccount(whoGet, -dividedAmount);
        }
    }
    for (const people in accounts) {
        let money = Math.round(accounts[people] * 100) / 100;
        let toConcat = '';
        if (money > 0.0) toConcat = '+';
        result.push({ "people": people, "money": toConcat.concat(money.toString()) })
    }
    return [result, accounts];
}


function listOfRefunds(accounts) {
    /**
     * Returns the list of transactions that should be done for everyone to get their money back.
     *
     * @param {dictionary} accounts : Contains the name of the people as key and their money account as value.
     * Example: {"michel": 10, "george": 15.6, "sebastien": -25.6}
     *
     * @return {list} : A list of dictionaries to use with moustache, representing who owes how much to whom.
     * Example: [{"debtor": "Louis", "howMuch": 5, "creditor": "Simon"}, {...}]   --> Louis owes 5€ to Simon.
     */
    let balanceList = [];
    for (const creditor in accounts) {
        if (accounts[creditor] > 0) {
            for (const debtor in accounts) {
                if (accounts[debtor] < 0) {
                    let toRetrieve = Math.round(accounts[creditor] * 100) / 100;
                    let toGive = Math.round(Math.abs(accounts[debtor]) * 100) / 100;
                    if (toGive >= toRetrieve) {
                        accounts[creditor] = 0;
                        accounts[debtor] = accounts[debtor] + toRetrieve;
                        if (toRetrieve > 0) {
                            balanceList.push({ "debtor": debtor, "howMuch": toRetrieve, "creditor": creditor });
                        }
                    } else {
                        accounts[creditor] = accounts[creditor] - toGive;
                        accounts[debtor] = 0;
                        if (toGive > 0) {
                            balanceList.push({ "debtor": debtor, "howMuch": toGive, "creditor": creditor });
                        }
                    }
                }
            }
        }
    }
    return balanceList;
}
