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
// var _server_domain = "http://192.168.1.51:8888";
// var _database_domain = "http://192.168.1.51:5984";
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
var _trilaterationTimer; // This is the timer triggered by setInterval in the trilateration function
var _searched_people; // an array containing the staff/people who have been found with the query. It's a single dimension array containing objects (staff)
var _searched_rooms; // an array containing all the rooms which have been found with the query. It's a single dimension array containing ARRAYS with two fields: the object (room) and floor number (the _id of the document)
var _sortedList; // a list of beacons sorted by signal strength
var _floor // the floor number corresponding to the room or place the user is searching for
var _b1X, _b1Y; // X and Y coordinates of beacon 1
var _b2X; // X coordinate of beacon 2, Y coordinate it's not needed for calculations
var _b3X, _b3Y; // X and Y coordinates of beacon 3
var _destX, _destY; // X and Y coordinates of the destination point over the map
var _stopLoop = false; // This bool prevents the application from retrieving and loading a flor map each 500ms (which is the beacons' list refresh rate)
var _currentfloor; // This int indicates the floor where the user is at.
var _firstTime = false; // This boolean controls whether it is necessary to execute 'requestMapImages' when syncDB is called.
var _mapNames = ["0_planta_cero.jpg", "1_planta_uno.jpg", "2_planta_dos.jpg", "3_planta_tres.jpg", "4_planta_cuatro.jpg", "5_planta_cinco.jpg"]; // This array contains the names of the images representing the maps. Whenever we declare a new map or we change its name, we should ONLY do it here, not anywhere else in the code.
var _beaconsDistances = {}; // This object contains a set of 5 measured distances of every beacon is so as to calculate an average of the values.
var _lastKnownBeaconsDistances = {}; // This object contains a set of three beacons with their respective last known correct and appropiate distance. This is used to avoid NaN values in trilateration.
var _lastKnownXcoordinate; // This value saves the last available, correct, accurate and known X coordinate of the origin point ('YOU' label). This is used to prevent the app from loosing connection with beacons.
var _lastKnownYcoordinate; // This value saves the last available, correct, accurate and known Y coordinate of the origin point ('YOU' label). This is used to prevent the app from loosing connection with beacons.
var _allowYOUlabel = false; // A boolean that indicates whether to allow the YOU label (source point; user's position) to be shown. This doesn't mean that it will be shown, this means that there exist a communication with the beacons and hence, we allow the label to be shown.
var _sameFloor = -1; // A boolean indicating whether the user is at the same floor as the one he/she is searching for. The initial value is -1 because is the initial one.
var _input; // A boolean representing whether an text input has gained focus or not.
var _viewportHeight; // This is the Height of the Viewport of the application at some point in time.
var _softKeyboard = false; // A boolean representing whether the soft keyboard is shown or not.
var _signedInUser = null; // This is a Javascript object representing the user just signed in. The containing fields are: 'email', 'idToken', 'userId', 'displayName', 'imageUrl'. More info at: https://github.com/EddyVerbruggen/cordova-plugin-googleplus
var _carrete_horas = ""; // This will contain a snippet of HTML code of a dropdown object, it will exactly have a list of <option> indicating the hour
var _carrete_minutos = "";// This will contain a snippet of HTML code of a dropdown object, it will exactly have a list of <option> indicating the minutes
var _editingInProgress = false; // This variable controls whether the user has changed anything in the EDIT_CONTACT page. If a change occured, then, the corresponding prompt dialog will appear whenever he/she tries to swich between GUIs.
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
    },
    // 'deviceready' Event Handler
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // 'backkeydown' Event Handler
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onBackButton: function() {
        // Common (interesting) actions:
        // navigator.app.exitApp();  // To Exit Application
        // navigator.app.backHistory(); // To go back

        // We need to distinguish between different pages. Normally, you'd want to go home. Some other times, you'd want just to go back one step in history.
        if (window.location.hash == "#spa_edit_contact") {
            if (_editingInProgress) {
                prompt_savecancel("DISCARD changes", 0); // The text here can be anything you want
            } else {
                // GO BACK ONE STEP IN HISTORY:
                navigator.app.backHistory();
                _editingInProgress = false; // We reset the variable for the next ocasion
            }
        } else {
            evothings.eddystone.stopScan(); // we stop the scan because is not needed anymore
            cleanGUI();
            clearInterval(_trilaterationTimer); // In case we go back from Map page, this is to avoid applying trilateration for ever.
            window.location = "#spa_index";
        }
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        if (window.hyper && window.hyper.log) { console.log = hyper.log }
        fetchDB(); // This makes sure the databases are fetched. It will create the local databases if it is needed, otherwise it will sync with remote database and update the data.
        // DBinfo(_db);
        // DBinfo(_dbrooms);
        // DBinfo(_dbbeacons);
        // deleteDB("staffdb");
        // deleteDB("roomsdb");
        // deleteDB("beaconsdb");
        _viewportHeight = window.innerHeight; // Here we set the Height of the Viewport to the corresponding variable.
        // The following event is fired/triggered when the "clear" icon in the main seearch bar text input is pressed.
        // This might have to be changed in the future because no all inputs have to have this behaviour. Selectors are crazy, I cannot select what I want.
        $(".ui-input-clear").on("click", function() {
            hideLiveSearchResults();
        });

        // createDB("staff"); // to DELETE in the near future
        // createDB("rooms"); // to DELETE in the near future
        // createDB("beacons"); // to DELETE in the near future
    }
};
