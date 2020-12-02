module.exports = {


    addExpense: function (req, res, dbo) {
        /**
         *
         *
         */
        dbo.collection('expenses').findOne({ "groupe": req.session.team_ID }, function (err, expenses) {
            let receivers = req.body.receveurs;
            if (!(req.body.receveurs instanceof Object)) receivers = [req.body.receveurs];
            if (expenses === null) {
                dbo.collection('expenses').insertOne({
                    "groupe": req.session.team_ID,
                    "expense_id": 0,
                    "expensesArray": [{ "_id": 0, "title": req.body.expenseTitle, "date": req.body.date, "amount": req.body.amount, "payeur": req.body.payeur, "receveurs": receivers }]
                }, function (err, _) {
                    dbo.collection('expenses').updateOne(
                        { "groupe": req.session.team_ID },
                        {
                            $inc: { "expense_id": 1 }
                        }, function (err, _) {
                            if (err) throw err;
                            res.redirect('/depenses');
                        }
                    );
                });
            } else {
                dbo.collection('expenses').updateOne(
                    { "groupe": req.session.team_ID },
                    {
                        $push: { "expensesArray": { "_id": expenses.expense_id, "title": req.body.expenseTitle, "date": req.body.date, "amount": req.body.amount, "payeur": req.body.payeur, "receveurs": receivers } },
                        $inc: { "expense_id": 1 }
                    }, function (err, _) {
                        if (err) throw err;
                        res.redirect('/depenses');
                    }
                );
            }
        });
    },


    deleteExpense: function (req, res, dbo) {
        /**
         *
         *
         */
        dbo.collection('expenses').updateOne({
            "groupe": req.session.team_ID
        }, {
            $pull: {
                "expensesArray": {
                    "_id": Number(req.body.expense_id)
                }
            }
        });
        res.redirect('/depenses')
    },


    expenseToArray: function (req, dbo) {
        /**
         *
         *
         */
        let depenses = [];
        dbo.collection('expenses').findOne({ "groupe": req.session.team_ID }, function (err, expenses) {
            for (const dep of expenses.expensesArray) {
                depenses.push({ "whoPaid": dep.payeur, "amount": dep.amount, "receivers": dep.receveurs })
            }
        });
        return depenses
    },


    makeAccounts: function (req, dbo) {
        /**
         * Returns the people associated with his money (positive or negative).
         *
         * @return {dictionary}   A dictionary representing who has how much money in positive or negative.
         * Example: {"Louis" : 20, "Simon": -10, "Fred": -10}   --> Louis needs to get 20€ back, Simon has to give 10€ back, same for Fred.
         */
        function addToAccount(person, amount) {
            if (person in accounts) return accounts[person] + amount;
            return amount;
        }
        let accounts = {};
        let result = [];
        dbo.collection('expenses').findOne({ "groupe": req.session.team_ID }, function (err, expenses) {
            for (const dep of expenses.expensesArray) {
                let person = dep.payeur;
                let amount = Number(dep.amount);
                accounts[person] = addToAccount(person, amount);
                let dividedAmount = amount / dep.receveurs.length;
                for (const whoGet of dep.receveurs) {
                    accounts[whoGet] = addToAccount(whoGet, -dividedAmount);
                }
            }
            for (const people in accounts) {
                result.push({ "people": people, "money": Math.round(accounts[people] * 100) / 100 })
            }
        });
        return result;
    },


    balance: function (req, dbo) {
        /**
         * Returns the transactions that should be done for everyone to get their money back.
         *
         * @return {list}   A list of dictionaries representing who owes how much to whom.
         * Example: [{"debtor": "Louis", "howMuch": 5, "creditor": "Simon"}, {...}]   --> Louis owes 5€ to Simon.
         */
        function addToAccount(person, amount) {
            if (person in accounts) return accounts[person] + amount;
            return amount;
        }
        let accounts = {};
        let balanceList = [];
        dbo.collection('expenses').findOne({ "groupe": req.session.team_ID }, function (err, expenses) {
            for (const dep of expenses.expensesArray) {
                let person = dep.payeur;
                let amount = Number(dep.amount);
                accounts[person] = addToAccount(person, amount);
                let dividedAmount = amount / dep.receveurs.length;
                for (const whoGet of dep.receveurs) {
                    accounts[whoGet] = addToAccount(whoGet, -dividedAmount);
                }
            }
            for (const creditor in accounts) {
                if (accounts[creditor] > 0) {
                    for (const debtor in accounts) {
                        if (accounts[debtor] < 0) {
                            let toRetrieve = Math.round(accounts[creditor] * 100) / 100;
                            let toGive = Math.round(Math.abs(accounts[debtor]) * 100) / 100;
                            if (toGive >= toRetrieve) {
                                accounts[creditor] = 0;
                                accounts[debtor] = accounts[debtor] + toRetrieve;
                                balanceList.push({ "debtor": debtor, "howMuch": toRetrieve, "creditor": creditor });
                            } else {
                                accounts[creditor] = accounts[creditor] - toGive;
                                accounts[debtor] = 0;
                                balanceList.push({ "debtor": debtor, "howMuch": toGive, "creditor": creditor });
                            }
                        }
                    }
                }
            }
        });
        return balanceList;
    }

};
