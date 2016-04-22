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
var _tuples; // text lines read from stafflist ''.txt'
var _db; // database
var _reva; // returned value for any function
var _searched_people; // an array containing the staff/people who have been found with the query
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
            createDB(); // This call creates the database for the firt time, reads staff list and loads the data into the database
                        // If it is not the first time, the database is just fetched

        // Evothings.eddystone.js: Timer that displays list of beacons.
        var timer = null;
        // Evothings.eddystone.js: Start tracking beacons!
        setTimeout(startScan, 500);
        // Evothings.eddystone.js: Timer that refreshes the display.
        timer = setInterval(updateBeaconList, 500);

        /* IScroll 5 */
        // If you change the elements or the structure of your DOM you should call the refresh method: myScroll.refresh();
    	// There are multiple events you can handle:
    	// zoomEnd
    	// zoomStart
    	// scrollStart ...
    	// like this: myScroll.on('scrollEnd', doSomething);
    	// more info at: https://github.com/cubiq/iscroll
    	// var myScroll = new IScroll('#map_wrapper', {
    	// 	zoom: true, // It allosw zooming
    	// 	scrollX: true, // It allows to scroll in the X axis
    	// 	scrollY: true, // It allows to scroll in the Y axis
    	// 	mouseWheel: true, // It listens to mouse wheel event
    	// 	zoomMin:0.1, // Default: 1
    	// 	freeScroll:true, // It allows to perform a free scroll within the wrapper. Not only strict X and Y scrolling.
    	// 	deceleration: 0.0001,
    	// 	wheelAction: 'zoom' // It regulates the wheel behaviour (zoom level vs scrolling position)
    	// });

        /* Lo que habia al crear la app: */
        /*var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);*/
    }
};
