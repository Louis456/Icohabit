var tools = require('./tools');

module.exports = {


    addTask: function (req, res, dbo) {
        /**
         * Add a task in 'todo' collection of db in the document of the corresponding group.
         *
         * If no such document exist yet, create the document of the group.
         * Else, it pushes the task in the tasks list of the group document.
         * Redirects to todolist page.
         */
        dbo.collection('todo').findOne({ "groupe": req.session.team_ID }, function (err, todoList) {
            if (err) throw err;
            if (todoList === null) {
                dbo.collection('todo').insertOne({
                    "groupe": req.session.team_ID,
                    "taskTodo_id": 0,
                    "tasks": [{ "date": tools.getPrettyDate(req.body.date), "dateGetTime": new Date(req.body.date).getTime(), "accountant": req.body.accountant, "task": req.body.task, "_id": 0, "done": false }]
                }, function (err, _) {
                    if (err) throw err;
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
                dbo.collection('todo').updateOne(
                    { "groupe": req.session.team_ID },
                    {
                        $push: { "tasks": { "date": tools.getPrettyDate(req.body.date), "dateGetTime": new Date(req.body.date).getTime(), "accountant": req.body.accountant, "task": req.body.task, "_id": todoList.taskTodo_id, "done": false } },
                        $inc: { "taskTodo_id": 1 }
                    }, function (err, _) {
                        if (err) throw err;
                        res.redirect('/todolist');
                    }
                );
            }
        });
    },


    deleteTask: function (req, res, dbo) {
        /**
         * Pull a task from the tasks list of of a group document in the 'todo' collection.
         * Redirect to todolist page.
         */
        dbo.collection('todo').updateOne(
            { "groupe": req.session.team_ID },
            {
                $pull: { "tasks": { "_id": Number(req.body.task_id) } }
            }
        );
        res.redirect('/todolist');
    },


    checkTask: function (req, res, dbo) {
        /**
         * In 'todo' collection, in a group document, in the tasks list, set the field "done" of a given task to true.
         * Redirect to todolist page.
         */
        dbo.collection('todo').updateOne(
            { "groupe": req.session.team_ID, "tasks._id": Number(req.body.task_id) },
            {
                $set: { "tasks.$.done": true }
            }, function (err, _) {
                if (err) throw err;
                res.redirect('/todolist');
            }
        );
    },


    gatherTodolistByDate: function (tasks, done) {
        /**
         * @param {Array} tasks : The array containing all the tasks of a group.
         * @param {Boolean} done : Used to filter by field "done" === done for each dictionary.
         *
         * @return {Array} Return a list of objects corresponding to the same tasks but grouped by date
         */
        let tasksDoneOrPast = tasks.filter(function (eachTask) {
            return eachTask.done === done;
        });
        let groupedByDate = [];
        for (element of tasksDoneOrPast) {
            if (groupedByDate.length === 0) {
                groupedByDate.push({ "date": element.date, "dateGetTime": element.dateGetTime, "tasks": [{ "accountant": element.accountant, "task": element.task, "_id": element._id, "done": element.done }] })
            } else if (groupedByDate.some(each => each.date === element.date)) {
                let idx = groupedByDate.findIndex(each => each.date === element.date);
                groupedByDate[idx].tasks.push({ "accountant": element.accountant, "task": element.task, "_id": element._id, "done": element.done })
            } else {
                groupedByDate.push({ "date": element.date, "dateGetTime": element.dateGetTime, "tasks": [{ "accountant": element.accountant, "task": element.task, "_id": element._id, "done": element.done }] })
            }
        }
        return groupedByDate;
    }

};
