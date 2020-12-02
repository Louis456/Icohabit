module.exports = {


    addExpense: function (req, res, dbo) {
        /**
         *
         *
         */
        dbo.collection('expenses').findOne({ "groupe": req.session.team_ID }, function (err, expenses) {
            if (expenses === null) {
                dbo.collection('expenses').insertOne({
                    "groupe": req.session.team_ID,
                    "expense_id": 0,
                    "expensesArray": [{"_id": 0, "title": req.body.expenseTitle, "date": req.body.date, "amount": req.body.amount, "payeur": req.body.payeur, "receveurs": req.body.receveurs}]
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
                        $push: { "expensesArray": {"_id": expenses.expense_id, "title": req.body.expenseTitle, "date": req.body.date, "amount": req.body.amount, "payeur": req.body.payeur, "receveurs": req.body.receveurs} },
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
                "expensesArray": { "_id": Number(req.body.expense_id)
            }
        });
        res.redirect('/depenses')
    },


    resolveExpense: function (req, res, dbo) {
        /**
         *
         *
         */
        res.redirect('/depenses')
    },


    balance: function (expenses) {
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

};
