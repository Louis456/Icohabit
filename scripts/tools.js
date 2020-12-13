module.exports = {


    isConnected: function (req) {
        /**
         * Return a boolean.
         *
         * @return True if the user is connected, otherwise false.
         */
        if (req.session.username) return true;
        return false;
    },

    hasChosenGroup: function (req) {
        /**
         * Return a boolean.
         *
         * @return True if the user has chosen a group, otherwise false.
         */
        if (req.session.team_ID) return true;
        return false;
    },


    displayOrNot: function (req, where) {
        /**
         * If a cookie has been created then remove the cookie and display, otherwise, hide the message.
         *
         * @param {string} where : Represents where the alert message should be displayed.
         *
         * @return "display:block" to show the alert in html if the cookie exist, otherwise "display:none" to hide.
         */
        if (where === "login" && req.session.displayLogInError != null) {
            req.session.displayLogInError = null;
            return "display:block";
        } else if (where === "register" && req.session.displayRegisterError != null) {
            req.session.displayRegisterError = null;
            return "display:block"
        } else if (where === "leave" && req.session.displayLeaveGroupError != null) {
            req.session.displayLeaveGroupError = null;
            return "display:block"
        } else if (where === "join" && req.session.displayJoinGroupError != null) {
            req.session.displayJoinGroupError = null;
            return "display:block"
        } else if (where === "join" && req.session.displayAlreadyInGroupError != null) {
            return "display:block"
        }
        return "display:none"
    },


    launchAppPage: function (req, res, dbo) {
        /**
         * Create two new cookies (team_ID & team_name) and redirect to the App page.
         */
        req.session.team_ID = req.body.team_ID
        dbo.collection('groupes').findOne({"_id": Number(req.body.team_ID)}, function (err, group) {
            if (err) throw err;
            req.session.team_name = group.groupname;
            res.redirect('/app')
        });
    },


    sortByDate: function (arr, inverse=false) {
        /**
         * @param {Array} arr: Represents an array of objects containing a "date" key
         * @param {boolean} inverse: Set as false by default, if true sort in reverse order.
         *
         * @return {Array} sortedByDate: Represents the input array sorted by date in chronological order
         */
        if (inverse) {
            sortedByDate = arr.sort((a,b) => b.dateGetTime - a.dateGetTime);
        } else {
            sortedByDate = arr.sort((a,b) => a.dateGetTime - b.dateGetTime);
        }
        return sortedByDate;
    },


    getPrettyDate: function (date) {
        /**
         * Return a prettier date than the default one.
         */
        let splitted = date.split('-');
        return splitted[2]+'/'+splitted[1]+'/'+splitted[0];
    }

};
