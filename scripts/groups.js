var bcrypt = require('bcrypt');

module.exports = {

    createGroup: function (req, res, dbo) {
        /**
         *
         *
         *
         */
        dbo.collection('groupes').findOne({ "_id": 0 }, function (err, ids) {
            if (err) throw err;
            bcrypt.genSalt(10, function (err, salt) {
                if (err) throw err;
                bcrypt.hash(req.body.newpwdTeam, salt, function (err, encrypted) {
                    if (err) throw err;
                    dbo.collection('groupes').insertOne({
                        "groupname": req.body.newTeam,
                        "password": encrypted,
                        "_id": ids.idcount,
                        "members": [req.session.username]
                    });
                    dbo.collection('users').updateOne(
                        { "username": req.session.username },
                        {
                            $addToSet: { "groupes": ids.idcount }
                        }
                    );
                    dbo.collection('groupes').updateOne(
                        { "_id": 0 },
                        {
                            $inc: { "idcount": 1 }
                        }
                    );
                    dbo.collection('groupes').createIndex({ groupname: "text", _id: "text" });
                    res.redirect('/groupes');
                });
            });
        });
    },


    joinGroup: function (req, res, dbo) {
        /**
         * Check if the group exist and if the password is correct.
         * Check if the user is already in the group, if it is then just refresh the page.
         * If correct, add the user to group's members list, the group to user's group list and then refresh the page.
         * Else, create a cookie to use with tools.displayOrNot() to display an error message
         * after the page is refreshed.
        */
        dbo.collection('groupes').findOne({ "_id": Number(req.body.teamID) }, function (err, group) {
            if (err) throw err;
            if (group != null) {
                if (!group.members.includes(req.session.username)) {
                    bcrypt.compare(req.body.pwdTeam, group.password, function (err, result) {
                        if (err) throw err;
                        if (result) {
                            dbo.collection('users').updateOne(
                                { "username": req.session.username },
                                {
                                    $addToSet: { "groupes": group._id }
                                }
                            );
                            dbo.collection('groupes').updateOne(
                                { "_id": group._id },
                                {
                                    $addToSet: { "members": req.session.username }
                                }
                            );
                            res.redirect('/groupes');
                        } else {
                            req.session.displayJoinGroupError = "yes";
                            res.redirect('/groupes#createorjoin');
                        }
                    });
                } else {
                    req.session.displayAlreadyInGroupError = "yes";
                    res.redirect('/groupes#createorjoin');
                }
            } else {
                req.session.displayJoinGroupError = "yes";
                res.redirect('/groupes#createorjoin');
            }
        });
    },


    leaveGroup: function (req, res, dbo) {
        /**
         * Check if the group exist and if the user is a member of it.
         * If correct, remove the user from group's members list, the group from the user's group list and then refresh the page.
         * And if the group is now empty then remove the group and the associated todolist, planning and expenses from the database.
         * Else, create a cookie to use with tools.displayOrNot() to display an error message
         * after the page is refreshed.
        */
        dbo.collection('groupes').findOne({ "_id": Number(req.body.teamID) }, function (err, group) {
            if (err) throw err;
            if (group != null) {
                if (group.members.includes(req.session.username)) {
                    dbo.collection('users').updateOne(
                        { "username": req.session.username },
                        {
                            $pull: { "groupes": group._id }
                        }
                    );
                    dbo.collection('groupes').updateOne(
                        { "_id": group._id },
                        {
                            $pull: { "members": req.session.username }
                        }
                    );
                    if (group.members.length === 1) {
                        dbo.collection('groupes').deleteOne({ "_id": Number(req.body.teamID) });
                        dbo.collection('todo').deleteOne({ "_id": req.body.teamID });
                        dbo.collection('planning').deleteOne({ "_id": req.body.teamID });
                        dbo.collection('expenses').deleteOne({ "_id": req.body.teamID });
                    }
                    res.redirect('/groupes');
                } else {
                    req.session.displayLeaveGroupError = "yes";
                    res.redirect('/groupes#leave');
                }
            } else {
                req.session.displayLeaveGroupError = "yes";
                res.redirect('/groupes#leave');
            }
        });
    }

};
