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
var _tuples; // text lines read from stafflist '.txt'
var _jsondata // json documents read from rooms '.json' file
var _db; // database for staff
var _dbrooms; // database for rooms
var _reva; // returned value for any function
var _searched_people; // an array containing the staff/people who have been found with the query. It's a single dimension array containing objects (staff)
var _searched_rooms; // an array containing all the rooms which have been found with the query. It's a single dimension array containing ARRAYS with two fields: the object (room) and floor number (the _id of the document)
var _maps; // unidimensional array of images representing the maps
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
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // backkeydown Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onBackButton: function() {
        // app.receivedEvent('backbutton'); ESTO CREO QUE SE PUED QUITAR
        navigator.app.backHistory();
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        if (window.hyper && window.hyper.log) { console.log = hyper.log }
            createDB("staff"); // This call creates the database for the firt time, reads staff list and loads the data into the database
                            // If it is not the first time, the database is just fetched
            createDB("rooms");
            DBinfo();
            // deleteDB(_dbrooms);
            // deleteDB(_db);

        // Evothings.eddystone.js: Timer that displays list of beacons.
        var timer = null;
        // Evothings.eddystone.js: Start tracking beacons!
        setTimeout(startScan, 500);
        // Evothings.eddystone.js: Timer that refreshes the display.
        timer = setInterval(updateBeaconList, 500);

    }
};
