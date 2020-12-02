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
                    "eventsToCome": [{ "date": req.body.date, "dateGetTime":new Date(req.body.date).getTime(), "events":[{"participants": req.body.participants, "event": req.body.event, "_id": 0}] }],
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
                dbo.collection('planning').findOne({"groupe":req.session.team_ID, "eventsToCome.date":req.body.date}, function(err, planningContainingDate){
                    if (planningContainingDate === null) {
                        dbo.collection('planning').updateOne(
                            { "groupe": req.session.team_ID },
                            {
                                $push: { "eventsToCome": { "date": req.body.date, "dateGetTime":new Date(req.body.date).getTime(), "events":[{"participants": req.body.participants, "event": req.body.event, "_id": planning.eventsToCome_id}] } },
                                $inc: { "eventsToCome_id": 1 }
                            }, function (err, _) {
                                if (err) throw err;
                                res.redirect('/planning');
                            }
                        );
                    } else {
                        dbo.collection('planning').updateOne(
                            {"groupe":req.session.team_ID, "eventsToCome.date":req.body.date},
                            {
                                $push: {"eventsToCome.$.events": {"participants": req.body.participants, "event": req.body.event, "_id": planning.eventsToCome_id}},
                                $inc: {"eventsToCome_id":1}
                            }, function(err,_){
                                if (err) throw err;
                                res.redirect('/planning');
                            }
                        );
                    }
                });
            }
        });
    },


    filterPassedEvents: function (today,events,dbo,req) {
        /**
         *
         *
        **/
        let filteredPassedEvents = events.filter(function(eventsForGivenDate){
                return eventsForGivenDate.dateGetTime < Date.now();
            });
        dbo.collection('planning').updateOne(
            {"groupe":req.session.team_ID},
            {
                $push: {"eventsPassed": { $each: filteredPassedEvents}},
                $pull: {"eventsToCome": {"dateGetTime": {$lt: Date.now()}}}
            }
        );        
    }

};
