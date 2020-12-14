var tools = require('./tools');

module.exports = {


    addEvent: function (req, res, dbo) {
        /**
         * add an event in 'planning' collection of db in the document of the corresponding group
         * if no such document exist yet, create the document of the group
         * else, it pushes the event in the events list of the group document
         * redirects to planning page
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


    getPastEvents: function (events) {
        /**
         * @param {Array} events : Represents a list of objects corresponding to an event
         * @return {Array} pastEvents : Represents the input list filtered by Date in order to contain only events in the past
        **/
        let pastEvents = events.filter(function (eachEvent) {
            return eachEvent.dateGetTime < Date.now();
        });
        return pastEvents
    },


    getFutureEvents: function (events) {
        /**
         * @param {Array} events : Represents a list of objects corresponding to an event
         * @return {Array} futureEvents : Represents the input list filtered by Date in order to contain only future events
         */
        let futureEvents = events.filter(function (eachEvent) {
            return eachEvent.dateGetTime >= Date.now();
        });
        return futureEvents
    },


    deleteEvent: function (req, res, dbo) {
        /**
         * pull an event given the event_id from the events list of a group document in the 'planning' collection
         * redirects to planning page
         */
        dbo.collection('planning').updateOne(
            { "groupe": req.session.team_ID },
            {
                $pull: { "events": { "_id": Number(req.body.event_id) } }
            }
        );
        res.redirect('/planning');
    },


    gatherPlanningByDate: function (events) {
        /**
         * @param {Array} events : The array containing all the events of a group.
         * @return {Array} Return a list of objects corresponding to the same events but grouped by date
         */
        let groupedByDate = [];
        for (element of events) {
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
