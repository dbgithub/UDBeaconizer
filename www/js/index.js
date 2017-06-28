/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
// GLOBAL VARIABLES for all javascript files:
var _server_domain = "https://dev.morelab.deusto.es/beaconizer";
var _database_domain = "https://dev.morelab.deusto.es/pouchdb-beaconizer";
var _webClientID = '473073684258-jss0qgver3lio3cmjka9g71ratesqckr.apps.googleusercontent.com'; // This is a client ID created in Google Developer's Console page. This one is for Android applications.
var _staffdb_name='staffdb'; // Real database name in server-side.
var _roomsdb_name='roomsdb'; // Real database name in server-side.
var _beacons_name='beaconsdb'; // Real database name in server-side.
var _db; // database for staff
var _dbrooms; // database for rooms
var _dbbeacons; // database for beacons
var _db_alias = "staff";
var _dbrooms_alias = "rooms";
var _dbbeacons_alias = "beacons";
var _reva; // returned value for any function
var _index; // the index value for "searched rooms" and "searched people"
var _searched_people; // an array containing the staff/people who have been found with the query. It's a single dimension array containing objects (staff)
var _searched_rooms; // an array containing all the rooms which have been found with the query. It's a single dimension array containing ARRAYS with two fields: the object (room) and floor number (the _id of the document)
var _linkSearch = false // A boolean referencing whether the search was performed due to a link pressed action (within the contact page) or not
var _personRoomTouched = false; // A boolean representing whether the user has just clicked/touched a certain row among all the results (people or rooms). The purpose of this boolean is to avoid displaying the liveSearchResults div when is not necessary (because of the time delay that exist in searching)
var _personRoomTouchedTimerID; // This is the ID of the timer that is launched by a setTimeout while in searching process to prevent dispaying the liveSearchResults div when it is not necessary.
var _firstTime = false; // This boolean controls whether it is necessary to execute 'requestMapImages' when syncDB is called.
var _mapNames = ["0_planta_cero.jpg", "1_planta_uno.jpg", "2_planta_dos.jpg", "3_planta_tres.jpg", "4_planta_cuatro.jpg", "5_planta_cinco.jpg"]; // This array contains the names of the images representing the maps. Whenever we declare a new map or we change its name, we should ONLY do it here, not anywhere else in the code.
var _searchTimer; // A timer that executes a certain function when the user stops writing something in the search bar.
var _tooltipTimer; // Timer for a tooltip message on the screen.
    // GLOBAL VARIABLES used in "evothings.eddystone.js":
    var _trilaterationTimerID; // This is the ID of the timer triggered by a setInterval in the trilateration function
    var _beaconRemoverTimerID; // This is the ID of the timer triggered by a setInterval in the trilateration function to remove the old beacons from time to tijme
    var _frequencyHistogramTimerID; // This is the ID of the timer triggered by a setInterval in the trilateration function to clear out the readings obtained and stored in an array.
    var _watchIDaccelerometer; // This is the ID to watch the acceleremeter sensor during the trilateration process.
    var _blestatusTimerID; // This is the ID of the timer that checks periodically (every second) whether Bluetooth is enabled or not.
    var _beaconsDistances = {}; // This object contains a set of 5 measured distances of every beacon so as to calculate an average of the values.
    var _nearestbeacons = []; // An array containing the three NEAREST beacons from the total list of beacons.
    var _sortedList; // a list of beacons sorted by signal strength. The beacons in the list have already been filtered by our beacons' NAMESPACE.
    var _lastKnownBeaconsDistances = {}; // This object contains a set of three beacons with their respective last known correct and appropiate distance. This is used to avoid NaN values in trilateration.
    var _lastKnown5locations = []; // This array contains a set of 5 last-known locations (of the user) in the form of {X,Y} coordinates.
    var _lastKnownXcoordinate; // This value saves the last available, correct, accurate and known X coordinate of the origin point ('YOU' label). This is used to prevent the app from loosing connection with beacons.
    var _lastKnownYcoordinate; // This value saves the last available, correct, accurate and known Y coordinate of the origin point ('YOU' label). This is used to prevent the app from loosing connection with beacons.
    var _allowYOUlabel = false; // A boolean that indicates whether to allow the YOU label (source point; user's position) to be shown. This doesn't mean that it will be shown, this means that there exist a communication with the beacons and hence, we allow the label to be shown.
    var _floor // the floor number corresponding to the room or place the user is searching for
    var _sameFloor = -1; // A boolean indicating whether the user is at the same floor as the one he/she is searching for. The initial value is -1 because we haven't set it yet.
    var _stop = false; // This bool prevents the application from retrieving and loading a flor map each 500ms (which is the beacons' list refresh rate)
    var _currentfloor; // This int indicates the floor where the user is at.
    var _destX, _destY; // X and Y coordinates of the destination point over the map
    var _b1X, _b1Y; // X and Y coordinates of beacon 1
    var _b2X; // X coordinate of beacon 2, Y coordinate it's not needed for calculations
    var _b3X, _b3Y; // X and Y coordinates of beacon 3
    var _final_X; // This represents the X coordinate of the computed value after trilateration
    var _final_Y; // This represents the Y coordinate of the computed value after trilateration
    var _real_X; // This represents the X coordinate of the locatin of the person (device)
    var _real_Y; // This represents the Y coordinate of the locatin of the person (device)
    var _new_real_X; // This represents the X coordinate of the locatin of the person (device) after an average has been calculated (acceleremoter)
    var _new_real_Y; // This represents the Y coordinate of the locatin of the person (device) after an average has been calculated (acceleremoter)
    var _radii = {}; // An object that holds the values of the distances to the nearest three beacons. Among those distances one will be choosen to be the radius of the YOU circle.
    var _frequencyHistogram = []; // An array holding the number of times that a certain beacon has been scanned for each and every beacon. The index is the instance number of the beacon and the value is an object with two fields: the instance number of the beacon ('instance') and the appearance frequenc ('n'). e.g. _frequencyHistogram["00040002"] = {instance:"00040002", n:32};
    var _centroid = {}; // An object representing a coordinate (X,Y), that is, the centroid of the three beacons from which we have more readings.
    var _centroidRadius = 350; // This is the radius, not the width of the circle.
    var _previousAccel = {}; // an object to store the X, Y and Z of the last accelerometer sensor meassurements
    var _deltaAccel = {}; // an object to store the delta on X, Y and Z components between last and current accelerometer sensor meassurements
    var _deviceMotionless = false; // a boolean that estimates whether the device is motionless or not, which means that we should start calculating an average to make the RED DOT as still as possible.
    var _deviceMotionlessTriggered = false; // An auxiliary boolean that indicated if the setTimeout has been launched.
    var _avgEstimateAccelerometer = {}; // an object holding an average of X and Y coordinates for the user's estimated position
var _input; // A boolean representing whether a text input has gained focus or not.
var _viewportHeight; // This is the Height of the Viewport of the application at some point in time.
var _softKeyboard = false; // A boolean representing whether the soft keyboard is shown or not.
var _signedInUser = null; // This is a Javascript object representing the user just signed in. The containing fields are: 'email', 'idToken', 'userId', 'displayName', 'imageUrl'. More info at: https://github.com/EddyVerbruggen/cordova-plugin-googleplus
var _carrete_horas = ""; // This will contain a snippet of HTML code of a dropdown object, it will exactly have a list of <option> indicating the hour
var _carrete_minutos = "";// This will contain a snippet of HTML code of a dropdown object, it will exactly have a list of <option> indicating the minutes
var _editingInProgress = false; // This variable controls whether the user has changed anything in the EDIT_CONTACT page. If a change occured, then, the corresponding prompt dialog will appear whenever he/she tries to swich between GUIs.
var _amountOfRowsAdded = 0; // This integer represent IN TOTAL how many rows have been added to the GUI (in EDIT_CONTACT) starting at 0 index. It doesn't matter whether some of them (from the begining or the ending) were deleted or not. It's like a counter so that it doesn't crash when saving the profile.
var _removedRows = []; // This array contains the INDEXes of the rows within "changes_dictionary" that were deleted intentionally by the user.
var _showingDialog = false; // A boolean used to check whether there is already a notification dialog on the device's screen or not. The idea is to avoid DUPLICATE dialogs!!
var _preventClick = false; // A boolean that is used to prevent buttons from running their ontouchend event when the finger leaves the hoover space. It's like a trick.
var _wentOffline = false; // A boolean to avoid the message of 'online' event when the app starts up.
var _paddingMap = 1500; // The padding around the map image used to allow the user pan over something more than just the image
var _front = true; // A boolean representing which face of the card is been shown with jQuery flip plugin in the SPA Map

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener("backbutton", this.onBackButton, false);
        document.addEventListener("offline", this.onOffline, false);
        document.addEventListener("online", this.onOnline, false);
    },
    // 'offline' network connection loss
    onOffline: function() {
        if (!_showingDialog) {
            _showingDialog = true;
            navigator.notification.alert("Seems like there is a network connection problem! Please check your WiFi or Data connection and try again 😢", function() {_showingDialog = false;}, "No Internet connection", "Oki Doki!");
            console.log("Internet connection is OFFLINE");
            _wentOffline = true;
        }
    },
    // 'online' network connection comes back!
    onOnline: function() {
        if (_wentOffline) {
            window.plugins.toast.show("Seems like your Internet connection came back to life! Yesss!! 😃", 'long', 'bottom', null, function(e){console.log("error showing toast:")});
            console.log("Internet connection is ONLINE");
            _wentOffline = false;
        }
    },
    // 'backkeydown' Event Handler
    // The scope of 'this' is the event.
    // skip_prompt parameter is a boolean that can be set to true when you want to go back without showing the prompt
    onBackButton: function(skip_prompt) { // In JavaScript, remember that it is NOT necessary to indicate the parameter when you call this function for instance. You can make: hola(true) or hola(), it doesn't matter.
        // Common (interesting) actions:
        // navigator.app.exitApp();  // To Exit Application
        // navigator.app.backHistory(); // To go back
        // window.location.replace() -> evita que vayas atras en el history

        // We need to distinguish between different pages. Normally, you'd want to go home. Some other times, you'd want just to go back one step in history.
        if (window.location.hash == "#spa_edit_contact") {
            if (_editingInProgress && !skip_prompt) {
                prompt_savecancel("DISCARD changes", 0); // The text here can be anything you want
            } else {
                // GO BACK ONE STEP IN HISTORY:
                navigator.app.backHistory();
                _editingInProgress = false; // We reset the variable for the next ocasion
            }
        } else {
            cleanGUI();
            window.location = "#spa_index";
            parenLasRotativas(); // This stops the scan and resets the values for both Intervals set to calculate trilateration
            clearInterval(_blestatusTimerID);
        }
    },
    onDeviceReady: function() {
        if (window.hyper && window.hyper.log) { console.log = hyper.log }
        fetchDB(); // This makes sure the databases are fetched. It will create the local databases if it is needed, otherwise it will sync with remote database and update the data.
        // DBinfo(_db);
        // DBinfo(_dbrooms);
        // DBinfo(_dbbeacons);
        // deleteDB("staffdb");
        // deleteDB("roomsdb");
        // deleteDB("beaconsdb");
        _viewportHeight = window.innerHeight; // Here we set the Height of the Viewport to the corresponding variable.

        pluginsInitialization();
    }
};
