		// ORIGINAL UUID for easiBeacon beacons in iBeacon format:
		// UUID: A7AE2EB7-1F00-4168-B99B-A749BAC1CA64

		// Dictionary of beacons.
		var beacons = {};

		function startScan()
		{
			showMessage('Scan in progress.');
			evothings.eddystone.startScan(
				function(beacon)
				{
					// Update beacon data.
					beacon.timeStamp = Date.now();
					beacons[beacon.address] = beacon;
				},
				function(error)
				{
					showMessage('Eddystone scan error: ' + error);
				});
		}

		// Map the RSSI value to a value between 1 and 100.
		function mapBeaconRSSI(rssi)
		{
			if (rssi >= 0) return 1; // Unknown RSSI maps to 1.
			if (rssi < -100) return 100; // Max RSSI
			return 100 + rssi;
		}

		function getSortedBeaconList(beacons)
		{
			var beaconList = [];
			for (var key in beacons)
			{
				// We check that the beacon we insert in the array is one of our beacons and not other company's one
				if (uint8ArrayToString(beacons[key].nid) == "A7 AE 2E B7 A7 49 BA C1 CA 64".toLowerCase()) {
					beaconList.push(beacons[key]);
				}
			}
			beaconList.sort(function(beacon1, beacon2)
			{
				return mapBeaconRSSI(beacon1.rssi) < mapBeaconRSSI(beacon2.rssi);
			});
			return beaconList;
		}

		function updateBeaconList()
		{
			removeOldBeacons();
			// displayBeacons();
			applyTrilateration();
		}

		function removeOldBeacons()
		{
			var timeNow = Date.now();
			for (var key in beacons)
			{
				// Only show beacons updated during the last 60 seconds.
				var beacon = beacons[key];
				if (beacon.timeStamp + 60000 < timeNow)
				{
					delete beacons[key];
				}
			}
		}

		function displayBeacons()
		{
			// console.log("hello, display beacons");
			var html = '';
			var sortedList = getSortedBeaconList(beacons);
			for (var i = 0; i < sortedList.length; ++i)
			{
				var beacon = sortedList[i];
				var htmlBeacon =
					'<p>'
					+	htmlBeaconName(beacon)
					+	htmlBeaconURL(beacon)
					+ 	"Distance:" + htmlBeaconDistance(beacon) + '<br/>'
					+	htmlBeaconNID(beacon)
					+	htmlBeaconBID(beacon)
					+	htmlBeaconVoltage(beacon)
					+	htmlBeaconTemperature(beacon)
					+	htmlBeaconRSSI(beacon)
					+ '</p>';
				html += htmlBeacon
			}
			// console.log(html);
			// document.querySelector('#test_beacons').innerHTML = html;
			document.getElementById("test_beacons").innerHTML = html;

		}

		function htmlBeaconName(beacon)
		{
			var name = beacon.name || 'no name';
			return '<strong>' + name + '</strong><br/>';
		}

		function htmlBeaconURL(beacon)
		{
			return beacon.url ?
				'URL: ' + beacon.url + '<br/>' :  '';
		}

		function htmlBeaconURL(beacon)
		{
			return beacon.url ?
				'URL: ' + beacon.url + '<br/>' :  '';
		}

		function htmlBeaconNID(beacon)
		{
			return beacon.nid ?
				'NID: ' + uint8ArrayToString(beacon.nid) + '<br/>' :  '';
		}

		function htmlBeaconBID(beacon)
		{
			return beacon.bid ?
				'BID: ' + uint8ArrayToString(beacon.bid) + '<br/>' :  '';
		}

		function htmlBeaconVoltage(beacon)
		{
			return beacon.voltage ?
				'Voltage: ' + beacon.voltage + '<br/>' :  '';
		}

		function htmlBeaconTemperature(beacon)
		{
			return beacon.temperature && beacon.temperature != 0x8000 ?
				'Temperature: ' + beacon.temperature + '<br/>' :  '';
		}

		function htmlBeaconRSSI(beacon)
		{
			return beacon.rssi ?
				'RSSI: ' + beacon.rssi + ' | ' + beacon.txPower + '<br/>' :  '';
		}

		function htmlBeaconDistance(beacon)
		{
			if (beacon.rssi == 0) {return -1;}
			// The following 'if' conditional is a temporary patch. The ratio should be divided by the correct RSSI value.
			// Since we are using different types of beacons, some of them have the value of "-69", and some others "-59"
			// The original formula for calculating distance without taking into account the 'if' should be:
			// var ratio = (beacon.rssi*1.0)/-69; // InsteaD of -69 it should be txPower (that is, the rssi value measured at distance 1m)
			if (uint8ArrayToString(beacon.bid) == "00 00 04 00 00 03") {
				var ratio = (beacon.rssi*1.0)/-59; // InsteaD of -59 it should be txPower (that is, the rssi value measured at distance 1m)

			} else {
				var ratio = (beacon.rssi*1.0)/-69; // InsteaD of -69 it should be txPower (that is, the rssi value measured at distance 1m)

			}
			if (ratio < 1.0) {
				return Math.pow(ratio, 10).toFixed(2);

			} else {
				var accuracy = ((0.89976)*Math.pow(ratio,7.7095)) + 0.111;
				accuracy = accuracy.toFixed(2);
				return accuracy;
			}
		}

		function uint8ArrayToString(uint8Array)
		{
			function format(x)
			{
				var hex = x.toString(16);
				return hex.length < 2 ? '0' + hex : hex;
			}

			var result = '';
			for (var i = 0; i < uint8Array.length; ++i)
			{
				result += format(uint8Array[i]) + ' '; // Apparently this is represented with white spaces to wrap it as Bytes, becasue each Hexadecimal value represents 4bits.
			}
			return result.trim(); // Trim removes the last white space of the string
		}

		// It returns the floor the beacon is at physically speaking.
		function getFloor(instance) {
			// We remove all white spaces (thanks to a regular expression) introduced by the 'uint8ArrayToString' function and then we obtain the floor number
			return parseInt(instance.replace(/\s/g, "").substring(0, 6));
		}

		function showMessage(text)
		{
			console.log(text);
		}

		///////////////////////////////////////////
		// MY OWN FUNCTIONS:
		///////////////////////////////////////////

		// This function triggers all the business logic related to locating the user in a given floor.
		function locateUser() {
			// Evothings.eddystone.js: Timer that will be used to display list of beacons.
	        var timer = null;
	        // Evothings.eddystone.js: Start tracking beacons!
	        setTimeout(startScan, 500);
	        // Evothings.eddystone.js: Timer that refreshes the display.
	        timer = setInterval(updateBeaconList, 500);
		}

		// It estimates and returns the floor number the user is at based on an average upon the information provided by all the beacons.
		// For instance, if the user gets the following values representing the floor from the beacons: 2 + 2 + 1, it means that two of them are in the 2nd floor whereas there is another one in the 1st floor. The average estimates that the user is at 2nd floor.
		function estimateFloor() {
			// At this point, all the beacons from the list are our own beacons. The beacons we have bought. Not any other BLE device.
			_sortedList = getSortedBeaconList(beacons);
			// We iterate over all the beacons in the list and we will estimate the floor the user is at based on the AVERAGE of the same amount of beacons which are in the same floor
			var sum = 0;
			for (var i = 0; i < _sortedList.length; ++i)
			{
				var beacon = _sortedList[i];
				var instance = uint8ArrayToString(beacon.bid); // The instance is 6 bytes long represented as Hexadecimal. An Hexadecimal represents 4bits, hence the instance is 12 characters long (48bits divided by 4bits)
				var floor = getFloor(instance);
				sum += floor; // We will sum all the floor numbers captured from all beacons, we will calculate an average of it and we eventually conclude the floor the user is at
			}
			return Math.round((sum/_sortedList.length).toFixed(4)); // current floor
		}

		// This function applies the trilateration technique based on the location of at least three beacons and the floor which the user is at.
		function applyTrilateration() {
			_currentfloor = estimateFloor();
			var nearestbeacons = [];
			// We check whether the floor the user is at is equal to the floor of the room we are searching.
			// If both floors are different, then, we will let the user switch between both floors so as to be able
			// to see the room's location as well as user's location. Thus, you will be informed on how to get your room.
			// We look also at '_stopLoop' variable to prevent unnecesary work (e.g.loading the map each 500ms)
			setTimeout(function() {
				if (_floor != _currentfloor && !_stopLoop) { // This will occur if the user and the room are in different floors
					$("footer > img:first-child").fadeToggle(2500);
					duplicateMaps(_currentfloor);
				} else if (_floor == _currentfloor && _stopLoop) { // This will occur when the user and the room are eventually in the same floor.
					_stopLoop = false;
					removeDuplicatedMaps();
				}
			},1000) // If I take all this out of the setTimeout function, it doesn't work. I don't know why!

			for (var i = 0; i < _sortedList.length; ++i)
			{
				var beacon = _sortedList[i];
				if (nearestbeacons.length < 3) {
					if (getFloor(uint8ArrayToString(beacon.bid)) == _currentfloor) {
						nearestbeacons.push(beacon);
						// console.log("nearest beacon inserted:" + uint8ArrayToString(beacon.bid));
					} // END if
				} else {
					break;
				}
			} // END for

			// Now we retrieve the real coordinates of each beacon for the trilateration formula:
			for (j in nearestbeacons) {
				retrieveBeacon(uint8ArrayToString(nearestbeacons[j].bid), j); // The retrieval and assignment of the coordinates is done within the database function
			}
			// In order to apply trilateration, there are three important conditions we have to fulfill:
			// 1) One of the circles (beacons) has to be place on the origin of coordinates, that is: (0,0)
			// 2) Another circle (beacon) has to be on the X axis along with the beacon on (0,0)
			// 3) The three of them have to be on the same plane with z = 0
			// HEADS UP!!!!: The third beacon cannot be in the same X axis as the rest two beacons, otherwise the trilateration formula divides by 0 and this is not possible.
			// To make it feasible, there are some values we have to change to make the translation of coordinates. The idea is to calculate first the solution point coordinates for the three beacons meeting the conditions/requirements and then we will make a translation of the points.
			var new_b2X = _b2X - _b1X; // The X coordinate of the 2nd circle (beacon) is changed accordingly to the shift of the origin of coordinates. At the end, what we are doing is shifting (changing) the origin of coordinates to fit the conditions of trilateration.
			var new_b3X = _b3X - _b1X; // The X coordinate of the 3rd circle (beacon) is changed accordingly to the shift of the origin of coordinates. At the end, what we are doing is shifting (changing) the origin of coordinates to fit the conditions of trilateration.
			var new_b3Y = _b3Y - _b1Y; // The Y coordinate of the 3rd circle (beacon) is changed accordingly to the shift of the origin of coordinates. At the end, what we are doing is shifting (changing) the origin of coordinates to fit the conditions of trilateration.

			// X and Y coordinates of the solution point (the solution point is the one corresponding to the person with the device):
			// More info at: https://en.wikipedia.org/wiki/Trilateration
			var X = (Math.pow(htmlBeaconDistance(nearestbeacons[0]),2) - Math.pow(htmlBeaconDistance(nearestbeacons[1]),2) + Math.pow(new_b2X,2))/(2*new_b2X);
			var Y = ((Math.pow(htmlBeaconDistance(nearestbeacons[0]),2) - Math.pow(htmlBeaconDistance(nearestbeacons[2]),2) + Math.pow(new_b3X,2) + Math.pow(new_b3Y,2)) / (2*new_b3Y)) - (X*new_b3X/new_b3Y);
			// So far, X and Y coordinates shows the solution point for the three beacons placed around the origin of coordinates (0,0).
			// Now we have to translate the beacons matching them with the reality. The only thing to do here is to add the values of the coordinates of the original beacon we placed on (0,0)
			var real_X = parseFloat(_b1X) + parseFloat(X); // This represents the X coordinate of the locatin of the person (device)
			var real_Y = parseFloat(_b1Y) + parseFloat(Y); // This represents the Y coordinate of the locatin of the person (device)

			// Now we draw the location point where the user is at + we draw the corresponding label too:
			var svg_circle_source = document.getElementById("svg_circle_sourcepoint");
			var label_you = document.getElementById("p_you");
		    svg_circle_source.setAttribute("cx", parseInt(real_X));
		    svg_circle_source.setAttribute("cy", parseInt(real_Y));
			label_you.style.left=real_X + 25 +"px";
			label_you.style.top=real_Y + 25 +"px";
			// console.log("(X = "+X+",Y = "+Y+")");
			// console.log("(b1X:"+_b1X+",b1Y:"+_b1Y+")");
			// console.log("(realX = "+real_X+",realY = "+real_Y+")");

			// We calculate the distance from device's position to destination point. The calculated distance is shown in meters.
			var p_dist = document.getElementById("p_distanceTillDest");
			var distance = (Math.sqrt(Math.pow((real_X-_destX),2)+Math.pow((real_Y-_destY),2))/26).toFixed();
			if (isNaN(distance)) {
				p_dist.innerHTML = "?" + " m"
			} else {
				p_dist.innerHTML = distance + " m";
			}
		}

		// When the user is in another floor different to the room's floor, then we have to load two maps to let the user switch between them.
		function duplicateMaps(_currentfloor){
			setTimeout(function() {
				_stopLoop = true;
				// Now we will write the appropiate label to let the user know whether he/she has to go upstairs or downstairs:
				// var p_upstairs_downstairs = document.getElementById("p_upstairs_downstairs");
				// if (_currentfloor < _floor) {p_upstairs_downstairs.innerHTML="Go upstairs!";} else {p_upstairs_downstairs.innerHTML="Go downstairs!";}
		        retrieveMap(_currentfloor.toString(), true); // If I take this call out of setTimeout function, JavaScripts yields errors.
		    },0)
		}
