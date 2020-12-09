module.exports = {


    searchGroup: function (req, res, dbo) {
        /**
         *
         */
        dbo.collection('users').findOne({"username" : req.session.username}, function (err, userDoc) {
            let groupIds = userDoc.groupes;
            dbo.collection('groupes').find({"_id": {$in: groupIds} }).toArray(function (err, userGroups) {
                if (req.body.groupTextSearch.length) {
                    let result = [];
                    let queries = req.body.groupTextSearch.toLowerCase().split(' ');

                    for (query of queries) {
                        // Search for ids
                        for (group of userGroups) {
                            if (group["_id"].toString() === query) {
                                result.push(group);
                            }
                        }
                        // Search with min 3 characters
                        let min3chars = query.length - 2;
                        for (var i = 0; i < min3chars; i++) {
                            for (var j = 0; j < i + 1; j++) {
                                for (group of userGroups) {
                                    let group_name = group["groupname"].toLowerCase();
                                    if (group_name.includes(query.substring(j, query.length - i + j))) {
                                        if (!result.includes(group)) {
                                            result.push(group);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (result.length) {
                        res.render('groupes.html', {
                            IdButtonText: req.session.username,
                            displayErrorJoin: "display:none",
                            badIdJoinMsg: "",
                            displayErrorLeave: "display:none",
                            badIdLeaveMsg: "",
                            groupes: result
                        });
                    } else {
                        res.render('emptysearch.html', {
                            IdButtonText: req.session.username,
                            searchQuery: queries
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
    },


    searchPlanning: function (req, res, dbo) {
        /**
         *
         */
    },


    searchExpenses: function (req, res, dbo) {
        /**
         *
         */
    }

};
