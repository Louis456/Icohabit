module.exports = {


    addTask: function (req, res, dbo) {
        /**
         * add a task in 'todo' collection of db in the document of the corresponding group
         * if no such document exist yet, create the document of the group
         * else, it pushes the task in the tasks list of the group document
         * redirects to todolist page
         */
        dbo.collection('todo').findOne({ "groupe": req.session.team_ID }, function (err, todoList) {
            if (err) throw err;
            if (todoList === null) {
                dbo.collection('todo').insertOne({
                    "groupe": req.session.team_ID,
                    "taskTodo_id": 0,
                    "tasks": [{ "date": req.body.date, "dateGetTime":new Date(req.body.date).getTime(), "accountant": req.body.accountant, "task": req.body.task, "_id": 0, "done":false }]
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
                        $push: { "tasks": { "date": req.body.date, "dateGetTime":new Date(req.body.date).getTime(), "accountant": req.body.accountant, "task": req.body.task, "_id": todoList.taskTodo_id, "done":false } },
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
         * pull a task from the tasks list of of a group document in the 'todo' collection
         * redirects to todolist page
         */
        dbo.collection('todo').updateOne(
            { "groupe": req.session.team_ID},
            {
                $pull: { "tasks": { "_id": Number(req.body.task_id) } }
            }
        );
        res.redirect('/todolist');
    },


    checkTask: function (req, res, dbo) {
        /**
         * in 'todo' collection, in a group document, in the tasks list, set the field "done" of a given task to true
         * redirects to todolist page
         */
        dbo.collection('todo').updateOne(
            {"groupe":req.session.team_ID, "tasks._id":Number(req.body.task_id)},
            {
                $set: {"tasks.$.done": true}
            }, function (err,_) {
                if (err) throw err;
                res.redirect('/todolist');
            }
        );
    },


    getTasksTodo: function (tasks) {
        /**
         * @param {Array} tasks : Represents a list of objects corresponding to a task
         * @return {Array} tasksTodo : Represents the input list filtered by field "done" === false for each object
         */
        let tasksTodo = tasks.filter(function(eachTask){
            return eachTask.done === false;
        });
        return tasksTodo;
    },


    getTasksDone: function (tasks) {
        /**
         * @param {Array} tasks : Represents a list of objects corresponding to a task
         * @return {Array} tasksDone : Rpresents the input list filtered by field "done" === true for each object
         */
        let tasksDone = tasks.filter(function(eachTask){
            return eachTask.done === true;
        });
        return tasksDone;
    },

    groupTodolistByDate: function (tasks) {
        /**
         * @param {Array} tasks : Represents a list of objects corresponding to a task
         * @return {Array} groupedByDate : Represent a list of objects corresponding to the same tasks but grouped by date
         */
        let groupedByDate = [];
        for (element of tasks) {
            if (groupedByDate.length === 0) {
                groupedByDate.push({"date":element.date, "dateGetTime": element.dateGetTime, "tasks":[{"accountant": element.accountant, "task": element.task, "_id": element._id, "done": element.done}]})
            } else if (groupedByDate.some(each => each.date === element.date)) {
                let idx = groupedByDate.findIndex(each => each.date === element.date);
                groupedByDate[idx].events.push({"accountant": element.accountant, "task": element.task, "_id": element._id, "done": element.done})
            } else {
                groupedByDate.push({"date":element.date, "dateGetTime": element.dateGetTime, "tasks":[{"accountant": element.accountant, "task": element.task, "_id": element._id, "done": element.done}]})
            }
        }
        return groupedByDate;
    }



};
