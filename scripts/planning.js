module.exports = {


    addEvent: function (req, res, dbo) {
        /**
         * 
         * 
         */
        dbo.collection('planning').findOne({ "groupe": req.session.team_ID }, function (err, planning) {
            if (planning === null) {
                dbo.collection('planning').insertOne({
                    "groupe": req.session.team_ID,
                    "eventsToCome_id": 0,
                    "eventsPassed_id": 0,
                    "eventsToCome": [{ "date": req.body.date, "participants": req.body.participants, "event": req.body.event, "_id": 0 }],
                    "eventsPassed": []
                }, function (err, _) {
                    dbo.collection('planning').updateOne(
                        { "groupe": req.session.team_ID },
                        {
                            $inc: { "eventsToCome_id": 1 }
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
                        $addToSet: { "eventsToCome": { "date": req.body.date, "participants": req.body.participants, "event": req.body.event, "_id": planning.eventsToCome_id } },
                        $inc: { "eventsToCome_id": 1 }
                    }, function (err, _) {
                        if (err) throw err;
                        res.redirect('/planning');
                    }
                );
            }
        });
    },


    filterPassedEvents: function (req, res, dbo) {
        /**
         * 
         * 
         */
        dbo.collection('planning').findOne({ "groupe": req.session.team_ID }, function (err, planning) {
            if (err) throw err;
            events = planning.eventsToCome;
            console.log(events);
            console.log(events[0]);
            console.log(events[0].date);
        });
    }

};