var bcrypt = require('bcrypt');

module.exports = {


    register: function (req, res, dbo) {
        /**
         * If username already exist, then refresh the page.
         * Else insert a new document into the database with the user's input datas (password encrypted),
         * then create a cookie and redirect to the home page.
         */
        dbo.collection('users').findOne({
            "username": req.body.username
        }, function (err, user) {
            if (user === null) {
                bcrypt.genSalt(10, function (err, salt) {
                    if (err) throw err;
                    bcrypt.hash(req.body.pwd, salt, function (err, encrypted) {
                        if (err) throw err;
                        dbo.collection("users").insertOne({
                            "username": req.body.username,
                            "password": encrypted,
                            "entireName": req.body.name,
                            "email": req.body.mail,
                            "groupes": []
                        })
                    });
                })

                req.session.username = req.body.username
                res.redirect('/groupes');
            } else {
                req.session.displayRegisterError = "yes";
                res.redirect('/#identification');
            }
        });
    },


    connect: function (req, res, dbo) {
        /**
         * Compare the user's password with the hash stored in the database.
         * If it's correct then create cookie with user's username and redirect to Groups page.
         * Else create a cookie to use with tools.displayOrNot() to display an error message
         * after the page is refreshed.
         */
        dbo.collection('users').findOne({
            "username": req.body.usernamealready
        }, function (err, user) {
            if (err) throw err;
            if (user != null) {
                bcrypt.compare(req.body.pwdalready, user.password, function (err, result) {
                    if (err) throw err;
                    if (result) {
                        req.session.username = req.body.usernamealready //create cookie
                        res.redirect('/groupes');
                    } else {
                        req.session.displayLogInError = "yes";
                        res.redirect('/#identification');
                    }
                });
            } else {
                req.session.displayLogInError = "yes";
                res.redirect('/#identification');
            }
        });
    },


    disconnect: function (req, res) {
        /**
         * Disconnect the user.
         * Remove all the cookies and redirect to the home page.
         */
        req.session.username = null;
        req.session.team_ID = null;
        req.session.team_name = null;
        res.redirect('/');
    }

};
