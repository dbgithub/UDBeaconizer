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
var _dbbeacons; // database for beacons
var _reva; // returned value for any function
var _searched_people; // an array containing the staff/people who have been found with the query. It's a single dimension array containing objects (staff)
var _searched_rooms; // an array containing all the rooms which have been found with the query. It's a single dimension array containing ARRAYS with two fields: the object (room) and floor number (the _id of the document)
var _maps; // unidimensional array of images representing the maps
var _sortedList; // a list of beacons sorted by signal strenth
var _floor // the floor number corresponding to the room or place the user is searching for
var _b1X, _b1Y; // X and Y coordinates of beacon 1
var _b2X; // X coordinate of beacon 2, Y coordinate it's not needed for calculations
var _b3X, _b3Y; // X and Y coordinates of beacon 3
var _destX, _destY; // X and Y coordinates of the destination point over the map
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
        // navigator.app.exitApp();  // To Exit Application
        // navigator.app.backHistory(); // To go back
        evothings.eddystone.stopScan(); // we stop the scan because is not needed anymore
        window.location = "index.html";
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        if (window.hyper && window.hyper.log) { console.log = hyper.log }
            createDB("staff"); // This call creates the database for the firt time, reads staff list and loads the data into the database
                               // If it is not the first time, the database is just fetched
            createDB("rooms"); // This call creates the database for the firt time, reads staff list and loads the data into the database
                               // If it is not the first time, the database is just fetched
            createDB("beacons"); // This call creates the database for the firt time, reads staff list and loads the data into the database
                                   // If it is not the first time, the database is just fetched
            DBinfo();

            // deleteDB(_dbrooms);
            // deleteDB(_db);
            // deleteDB(_dbbeacons);

            // 3 seconds after the app is run, it forces to enable Bluetooth before any real scan is made.
            // NO ESTOY SEGURO DE MANTENER ESTE CODIGO? ES USEFUL? SI BUSCAN UNA ROOM RAPIDO PASAS A MAP.HTML Y A LOS 3 SEGUNDOS SE TE PARA A BUSQUEDA
            // setTimeout(function() {
            //     evothings.ble.startScan(null,null); // more info about the API: https://evothings.com/doc/lib-doc/module-cordova-plugin-ble.html  and its github page: https://github.com/evothings/cordova-ble
            //     evothings.ble.stopScan();
            // }, 3000)

        // ESTO ES LO QUE TENIA DESDE UN PRINCIPIO PARA TESTEAR LOS BEACONS EN INDEX.html
        // AHORA HE DE PASAR TODAS ESTAS LINEAS A UNA FUNCION DE DESPUES DE onload() de MAP.html
        // // Evothings.eddystone.js: Timer that displays list of beacons.
        // var timer = null;
        // // Evothings.eddystone.js: Start tracking beacons!
        // setTimeout(startScan, 500);
        // // Evothings.eddystone.js: Timer that refreshes the display.
        // timer = setInterval(updateBeaconList, 500);

    }
};
