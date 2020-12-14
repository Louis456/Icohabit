var tools = require('./tools');

module.exports = {


    addEvent: function (req, res, dbo) {
        /**
         * Add an event in 'planning' collection of db in the document of the corresponding group.
         * If no such document exist yet, create the document of the group.
         * Else, it pushes the event in the events list of the group document.
         * Redirects to planning page.
         */
        dbo.collection('planning').findOne({ "groupe": req.session.team_ID }, function (err, planning) {
            if (err) throw err;
            if (planning === null) {
                dbo.collection('planning').insertOne({
                    "groupe": req.session.team_ID,
                    "events_id": 0,
                    "events": [{ "date": tools.getPrettyDate(req.body.date), "dateGetTime": new Date(req.body.date).getTime(), "participants": req.body.participants, "event": req.body.event, "_id": 0 }]
                }, function (err, _) {
                    if (err) throw err;
                    dbo.collection('planning').updateOne(
                        { "groupe": req.session.team_ID },
                        {
                            $inc: { "events_id": 1 }
                        }, function (err, _) {
                            if (err) throw err;
                            res.redirect('/planning');
                        }
                    );
                });
            } else {
                dbo.collection('planning').updateOne(
                    { "groupe": req.session.team_ID },
                    {
                        $push: { "events": { "date": tools.getPrettyDate(req.body.date), "dateGetTime": new Date(req.body.date).getTime(), "participants": req.body.participants, "event": req.body.event, "_id": planning.events_id } },
                        $inc: { "events_id": 1 }
                    }, function (err, _) {
                        if (err) throw err;
                        res.redirect('/planning');
                    }
                );
            }
        });
    },


    deleteEvent: function (req, res, dbo) {
        /**
         * Pull an event given the event_id from the events array of a group document in the 'planning' collection.
         * Redirects to planning page.
         */
        dbo.collection('planning').updateOne(
            { "groupe": req.session.team_ID },
            {
                $pull: { "events": { "_id": Number(req.body.event_id) } }
            }
        );
        res.redirect('/planning');
    },


    gatherPlanningByDate: function (events, future) {
        /**
         * @param {Array} events : The array containing all the events of a group.
         * @param {Boolean} future : true to filter only future events, false to filter events in the past.
         *
         * @return {Array} An array of dictionaries corresponding to the same events but grouped by date.
         */
        let eventsPastorFuture = events.filter(function (eachEvent) {
            return (eachEvent.dateGetTime >= Date.now()) === future;
        });
        let groupedByDate = [];
        for (element of eventsPastorFuture) {
            if (groupedByDate.length === 0) {
                groupedByDate.push({ "date": element.date, "dateGetTime": element.dateGetTime, "events": [{ "participants": element.participants, "event": element.event, "_id": element._id }] })
            } else if (groupedByDate.some(each => each.date === element.date)) {
                let idx = groupedByDate.findIndex(each => each.date === element.date);
                groupedByDate[idx].events.push({ "participants": element.participants, "event": element.event, "_id": element._id })
            } else {
                groupedByDate.push({ "date": element.date, "dateGetTime": element.dateGetTime, "events": [{ "participants": element.participants, "event": element.event, "_id": element._id }] })
            }
        }
        return groupedByDate;
    }

};
