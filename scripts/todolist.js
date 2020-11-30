module.exports = {


    addTask: function (req, res, dbo) {
        /**
         * 
         * 
         */
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
    },


    deleteTaskTodo: function (req, res, dbo) {
        /**
         * 
         * 
         */
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
    },


    deleteTaskDone: function (req, res, dbo) {
        /**
         * 
         * 
         */
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
    },


    checkTask: function (req, res, dbo) {
        /**
         * 
         * 
         */
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

};