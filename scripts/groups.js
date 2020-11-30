var bcrypt = require('bcrypt');

module.exports = {


    createGroup: function (req, res, dbo) {
        /**
         * 
         * 
         * 
         */
        dbo.collection('groupes').findOne({
            "_id": 0
        }, function (err, ids) {
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(req.body.newpwdTeam, salt, function (err, encrypted) {
                    dbo.collection('groupes').insertOne({
                        "groupname": req.body.newTeam,
                        "password": encrypted,
                        "_id": ids.idcount,
                        "members": [req.session.username]
                    });
                    dbo.collection('users').updateOne({
                        "username": req.session.username
                    }, {
                        $addToSet: {
                            "groupes": ids.idcount
                        }
                    });
                    dbo.collection('groupes').updateOne({
                        "_id": 0
                    }, {
                        $inc: {
                            "idcount": 1
                        }
                    });
                    res.redirect('/groupes');
                });
            });
        });
    },


    joinGroup: function (req, res, dbo) {
        /**
         * Check if the group exist and if the password is correct.
         * if correct, add the user to group's member list and the group to the user's group list.
         * if not, display "badPassword" or "badId".
        */
        dbo.collection('groupes').findOne({
            "_id": Number(req.body.teamID)
        }, function (err, group) {
            if (group != null) {
                bcrypt.compare(req.body.pwdTeam, group.password, function (err, result) {
                    if (result) {
                        dbo.collection('users').updateOne({
                            "username": req.session.username
                        }, {
                            $addToSet: {
                                "groupes": group._id
                            }
                        });
                        dbo.collection('groupes').updateOne({
                            "_id": group._id
                        }, {
                            $addToSet: {
                                "members": req.session.username
                            }
                        });
                        res.redirect('/groupes');
                    } else {
                        req.session.displayJoinGroupError = "yes";
                        res.redirect('/groupes#createorjoin');
                    }
                });
            } else {
                req.session.displayJoinGroupError = "yes";
                res.redirect('/groupes#createorjoin');
            }
        });
    },


    leaveGroup: function (req, res, dbo) {
        /**
         * Check if the group exist and if the user is a member of it.
         * if correct, remove the user from group's member list and the group from the user's group list.
        */
        dbo.collection('groupes').findOne({
            "_id": Number(req.body.teamID)
        }, function (err, group) {
            if (group != null) {
                if (group.members.includes(req.session.username)) {
                    dbo.collection('users').updateOne({
                        "username": req.session.username
                    }, {
                        $pull: {
                            "groupes": group._id
                        }
                    });
                    dbo.collection('groupes').updateOne({
                        "_id": group._id
                    }, {
                        $pull: {
                            "members": req.session.username
                        }
                    });
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