module.exports = {


    searchGroup: function (req, res, dbo) {
        /**
         *
         */
        dbo.collection('users').findOne({"username" : req.session.username}, function (err, userDoc) {
            let groupIds = userDoc.groupes;
            dbo.collection('groupes').find({"_id": {$in: groupIds} }).toArray(function (err, userGroups) {
                let result = [];
                for (docu of userGroups) {
                    let queries = req.body.groupTextSearch.toLowerCase().split(' ');
                    let group_name = docu["groupname"].toLowerCase();
                    let group_id = docu["_id"].toString();
                    for (query of queries) {
                        if (group_name.includes(query) || group_id.includes(query)) {
                            result.push(docu);
                        }
                    }
                }
                res.render('groupes.html', {
                    IdButtonText: req.session.username,
                    displayErrorJoin: "display:none",
                    badIdJoinMsg: "",
                    displayErrorLeave: "display:none",
                    badIdLeaveMsg: "",
                    groupes: result
                });

                // { $text: { $search: req.body.groupTextSearch}}

                /* userGroups
                [
                  {
                    _id: 1,
                    groupname: 'TeamRocket',
                    password: '$2b$10$XAV7bhv40jMs0tA92tmogOk2d9bWGYy7kbE.czvINYeXrpRQ/Jk9m',
                    members: [ 'simona', 'simonb', 'michel' ]
                  },
                  {
                    _id: 2,
                    groupname: 'Chats',
                    password: '$2b$10$io7i1hTUhDOagoHzHi8pFuaxfk7521.jpA4Y9a9sOkPRJfLlAUClG',
                    members: [ 'simona' ]
                  },
                  {
                    _id: 10,
                    groupname: 'Yeee',
                    password: '$2b$10$iDDu3yvtR/Eo4LX782K4cOg5IuPuzejnukk6AtXDEOCuzGXtrvq7a',
                    members: [ 'simona' ]
                  }
                ]
                */
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
