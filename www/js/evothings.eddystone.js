	// ORIGINAL UUID for easiBeacon beacons in iBeacon standard:
	// UUID: A7AE2EB7-1F00-4168-B99B-A749BAC1CA64

	// GLOBAL VARIABLES
	var beacons = {}; // Dictionary of beacons.
	var undefinedCounter = 0; // It counts how many "undefined" values we get at least from one of the beacons. This counter works as an estimate to determine whether the readings from the beacons are weak or even
	// if there are not beacons readings at all. The latter case means that there are not beacons around or that
	// there exist a lot of interferences.


	function startScan() {
		showMessage('Scan in progress.');
		_beaconsDistances = {}; // The object containing a set of 5 measured distances of every beacon is reset.
		_lastKnownBeaconsDistances = {}; // This object contains a set of three beacons with their respective last known correct and appropiate distance. This is used to avoid NaN values in trilateration.
		evothings.eddystone.startScan(
			function(beacon)
			{
				// Update beacon data.
				beacon.timeStamp = Date.now();
				beacons[beacon.address] = beacon;
			},
			function(error)
			{
				showMessage('Eddystone scan error: ' + JSON.stringify(error));
			});
		}

	// Map the RSSI value to a value between 1 and 100.
	function mapBeaconRSSI(rssi)	{
		if (rssi >= 0) return 1; // Unknown RSSI maps to 1.
		if (rssi < -100) return 100; // Max RSSI
		return 100 + rssi;
	}

	function getSortedBeaconList()	{
		var beaconList = [];
		for (var key in beacons)
		{
			// We check that the beacon we insert in the array is one of our beacons and not other company's one as well as it's not corrupted:
			if (beacons[key] != null && beacons[key] !== undefined && uint8ArrayToString(beacons[key].nid) == "a7ae2eb7a749bac1ca64") { // Apparently, namespace ID has to be compared in lowercase values
				beaconList.push(beacons[key]);
			}
		}
		beaconList.sort(function(beacon1, beacon2)
		{
			return mapBeaconRSSI(beacon1.rssi) < mapBeaconRSSI(beacon2.rssi);
		});
		return beaconList;
	}

	function updateBeaconList()	{
		removeOldBeacons();
		applyTrilateration();
		// displayBeacons();
	}

	// Removes beacons older than 30 seconds (readings not received) from the beacons' dictionary
	function removeOldBeacons()	{
		var timeNow = Date.now();
		for (var key in beacons)
		{
			// Only keep beacons updated during the last 30 seconds.
			var beacon = beacons[key];
			if (beacon.timeStamp + 30000 < timeNow)
			{
				delete beacons[key];
			}
		}
	}

	function displayBeacons()	{
		console.log("hello, displaying beacons...");
		var html = '';
		var sortedList = getSortedBeaconList();
		for (var i = 0; i < sortedList.length; ++i)
		{
			var beacon = sortedList[i];
			var htmlBeacon =
			'<p>'
			+	htmlBeaconName(beacon)
			+	htmlBeaconURL(beacon)
			+ 	"Distance: " + htmlBeaconDistance(beacon) + '<br/>'
			+	htmlBeaconNID(beacon)
			+	htmlBeaconBID(beacon)
			+	htmlBeaconVoltage(beacon)
			+	htmlBeaconTemperature(beacon)
			+	htmlBeaconRSSI(beacon)
			+ 	htmlBeacontxPower(beacon)
			+ 	htmlBeaconAdvCnt(beacon)
			+ 	htmlBeaconDsecCnt(beacon)
			+ 	htmlBeaconRSSIBar(beacon)
			+ '</p>';
			html += htmlBeacon
		}
		console.log(html);
		// document.querySelector('#test_beacons').innerHTML = html;
		// document.getElementById("test_beacons").innerHTML = html;
	}

	function htmlBeaconName(beacon)	{
		var name = beacon.name || 'no name';
		return '<strong>' + name + '</strong><br/>';
	}

	function htmlBeaconURL(beacon)	{
		return beacon.url ?
		'URL: ' + beacon.url + '<br/>' :  '';
	}

	function htmlBeaconNID(beacon)	{
		return beacon.nid ?
		'NID: ' + uint8ArrayToString(beacon.nid) + '<br/>' :  '';
	}

	function htmlBeaconBID(beacon)	{
		return beacon.bid ?
		'BID: ' + uint8ArrayToString(beacon.bid) + '<br/>' :  '';
	}

	function htmlBeaconVoltage(beacon)	{
		return beacon.voltage ?
		'Voltage: ' + beacon.voltage + '<br/>' :  '';
	}

	function htmlBeaconTemperature(beacon)	{
		return beacon.temperature && beacon.temperature != 0x8000 ?
		'Temperature: ' + beacon.temperature + '<br/>' :  '';
	}

	function htmlBeaconRSSI(beacon)	{
		return beacon.rssi ?
		'RSSI: ' + beacon.rssi + '<br/>' :  '';
	}

	function htmlBeacontxPower(beacon)	{
		return beacon.txPower ?
		'txPower: ' + beacon.txPower + '<br/>' :  '';
	}

	function htmlBeaconAdvCnt(beacon)	{
		return beacon.adv_cnt ?
		'ADV_CNT: ' + beacon.adv_cnt + '<br/>' :  '';
	}

	function htmlBeaconDsecCnt(beacon)	{
		return beacon.dsec_cnt ?
		'DSEC_CNT: ' + beacon.dsec_cnt + '<br/>' :  '';
	}

	function htmlBeaconRSSIBar(beacon)	{
		return beacon.rssi ?
		'<div style="background:rgb(255,64,128);height:20px;width:'
		+ mapBeaconRSSI(beacon.rssi) + '%;"></div>' : '';
	}

	// This function returns a string representing the HEX number. Each Hexadecimal character represents 4bits. That's why sometimes the characters are
	// grouped by two characters, hence, 8bits = 1B.
	function uint8ArrayToString(uint8Array)	{
		function format(x)
		{
			var hex = x.toString(16);
			return hex.length < 2 ? '0' + hex : hex;
		}

		var result = '';
		for (var i = 0; i < uint8Array.length; ++i)
		{
			result += format(uint8Array[i]); // Comparing to the original implementation, I had to remove the whitespace from the returning statement.
		}
		return result;
	}

	// Returns the distance in meters between the beacon and the user (smartphone)
	function htmlBeaconDistance(beacon)	{
		// Firstly, we check whether the beacons are reachable or not. If we are not receiving signals from the beacons we will let the user know.
		if (undefinedCounter != -1) {
			undefinedCounter++;
			if (undefinedCounter == 16) {showToolTip('You might be experimenting some interferences! Beacons might not be reachable! :('); return null;}  // If 8 consecutive frames are not received, we warn the user.
			if (undefinedCounter == 30) {_allowYOUlabel = false; showYOUlabel(); return null;} // If 15 consecutive frames are not received, we make dissapear the 'YOU' label and source point.
			if (undefinedCounter == 50) { // If 30 consecutive frames are not received, we warn the user and force him/her to accept the message dialog.
				undefinedCounter = -1;
				_allowYOUlabel = false;
				if (!_showingToolTip) {
					_showingToolTip = true;
					navigator.notification.alert("It seems that you are experimenting strong interferences. No data readings " +
					"are received, make sure you have the Bluetooth feature enabled in your device " +
					" and ensure you are inside the building! :)", function() {_showingToolTip = false;}, "Serious interferences :(", "Oki Doki!");
				}
				return null;
			}
		}

		if (beacon.rssi >= 0) {return -1;}

		// The following 'if' conditional is a temporary patch/fix. The ratio should be divided by the correct RSSI value.
		// Since we are using different types of beacons, some of them have the value of "-69", and some others "-59"
		// The original formula for calculating distance without taking into account the 'if' should be:
		// var ratio = (beacon.rssi*1.0)/-69; // InsteaD of -69 it should be txPower (that is, the rssi value measured at distance 1m)
		var instancenum = uint8ArrayToString(beacon.bid);
		if (instancenum == "000004000003" || instancenum == "000004000004" || instancenum == "000004000005") {
			var ratio = (beacon.rssi*1.0)/-59; // InsteaD of -59 it should be txPower (that is, the rssi value measured at distance 1m)
		} else {
			var ratio = (beacon.rssi*1.0)/-69; // InsteaD of -69 it should be txPower (that is, the rssi value measured at distance 1m)
		}
		console.log("beacon.txPower = " + beacon.txPower);
		console.log("beacon.txPower-41 = " + (beacon.txPower-41));
		undefinedCounter = 0; // The counter is reset in case the contact with the beacons is again lost.
		_allowYOUlabel = true; // Now we allow the red label YOU that indicates the source point in the map (the user's position)
		// We allow it to be shown now because at this point we know that there exist a communication with the beacons.

		// The distance estimate is calculated as follow:
		if (ratio < 1.0) {
			return Math.pow(ratio, 10).toFixed(2);

		} else {
			var accuracy = ((0.89976)*Math.pow(ratio,7.7095)) + 0.111;
			accuracy = parseFloat(accuracy.toFixed(2));
			// return accuracy;
			if (_beaconsDistances[beacon.address] === undefined || _lastKnownBeaconsDistances[beacon.address] === undefined) {_beaconsDistances[beacon.address] = []; _lastKnownBeaconsDistances[beacon.address] = 0;}
			// console.log("_beaconsDistances["+instancenum+"]= " +_beaconsDistances[beacon.address].length); // Esto estaba antes sin comentar
			// console.log("_lastKnownBeaconsDistances["+instancenum+"]= " +_lastKnownBeaconsDistances[beacon.address]); // Esto estaba antes sin comentar
			if (_beaconsDistances[beacon.address].length < 7) {
				_beaconsDistances[beacon.address].push(accuracy);
				return _lastKnownBeaconsDistances[beacon.address];
			} else {
				var val = calculateAverageDistance(beacon.address);
				_lastKnownBeaconsDistances[beacon.address] = val;
				return val;
			}
		}
	}

	///////////////////////////////////////////
	// MY OWN FUNCTIONS:
	///////////////////////////////////////////

	// This function triggers all the business logic related to locating the user in a given floor. This can be considered as the MAIN function.
	function locateUser() {
		// Evothings.eddystone.js: 'timer' is the ID that identifies the timer created by "setInterval".
		_trilaterationTimer = null;
		// Evothings.eddystone.js: Start tracking beacons!
		setTimeout(startScan, 500);
		// Evothings.eddystone.js: Timer that refreshes the display.
		_trilaterationTimer = setInterval(updateBeaconList, 500);
	}

	// Calculate an average of measured distances of beacons.
	// It discards outliers (values too high or too low)
	function calculateAverageDistance(mac) {
		// Firstly, we remove the outliers (or the values that are the biggest/smallest ones even if they are slightly bigger/smaller):
		_beaconsDistances[mac].sort(function(a, b){return b-a}); // The array is sorted by size: from BIG to SMALL
		//  console.log(_beaconsDistances[mac][0] + " | " + _beaconsDistances[mac][1] + " | " + _beaconsDistances[mac][2] + " | " + _beaconsDistances[mac][3] + " | " + _beaconsDistances[mac][4] + " | " + _beaconsDistances[mac][5] + " | " + _beaconsDistances[mac][6] );
		_beaconsDistances[mac].shift(); // The first (smallest) value is removed from the array
		_beaconsDistances[mac].pop(); // The last (biggest) value is removed from the array
		// Now we compute an average among the values that remain in the array:
		var average = 0;
		var n = _beaconsDistances[mac].length;
		for (k = 0; k < n; k++) {
			average += _beaconsDistances[mac][k];
		} // END for
		// console.log("Average:" + (average/n).toFixed(2));
		return parseFloat((average/n).toFixed(2));
	}

	// It returns the floor the beacon is at, physically speaking.
	function getFloor(instance) {
		return parseInt(instance.substring(0, 6));
	}

	// Shows a message passed as a parameter
	function showMessage(text)	{
		console.log(text);
	}

	// It estimates and returns the floor number the user is at based on an average upon the information provided by all the beacons.
	// For instance, if the user gets the following values representing the floor from the beacons: 2 + 2 + 1, it means that two of them are in the 2nd floor whereas there is another one in the 1st floor. The average estimates that the user is at 2nd floor.
	function estimateFloor() {
		// At this point, all the beacons from the list are our own beacons. Not any other BLE device.
		_sortedList = getSortedBeaconList();
		// We iterate over all the beacons in the list and we will estimate the floor the user is at based on the AVERAGE of the same amount of beacons which are in the same floor
		var sum = 0;
		for (var i in _sortedList) // We are iterating over _sortedList's properties, that is, in this case, the indexes, e.g. 0,1,2,...
		{
			var beacon = _sortedList[i];
			var instance = uint8ArrayToString(beacon.bid); // The instance is 6 bytes long represented as Hexadecimal. An Hexadecimal represents 4bits, hence the instance is 12 characters long (48bits divided by 4bits)
			var floor = getFloor(instance);
			sum += floor; // We will sum all the floor numbers captured from all beacons, we will calculate an average of it and we eventually conclude the floor the user is at
		}
		return Math.round((sum/_sortedList.length).toFixed(4)); // current floor
	}

	// Checks whether the user with his/her smartphone is at the exact floor where the beacons are.
	// If the user is at the SAME floor, then, we will update the GUI accordingly.
	// If the user IS NOT at the same floor, then, we will let him/her know about it.
	function checkIfUserAtTheSameFloor(callback) {
		if (_floor != _currentfloor && !_stopLoop && !isNaN(_currentfloor)) { // This will occur if the user and the room are in different floors.
			$("footer > img:first-child").fadeToggle(2500);
			duplicateMaps(_currentfloor);
			_sameFloor = false; // A boolean indicating wether the user is at the same floor as the one he/she is searching for.
			// This works in conjuction with the "_allowYOUlabel" boolean to make the label YOU (source point, user's location) be visible.
			showYOUlabel();
		} else if (_floor == _currentfloor && _stopLoop) { // This will occur when the user and the room are eventually in the same floor.
			_stopLoop = false;
			removeDuplicatedMaps();
			_sameFloor = true; // A boolean indicating wether the user is at the same floor as the one he/she is searching for.
			// This works in conjuction with the "_allowYOUlabel" boolean to make the label YOU (source point, user's location) be visible.
			showYOUlabel();
		}
		callback();
	}

	// Inserts the three nearest beacons from the list of all beacons in an array.
	function retrieveNearestThreeBeacons(callback) {
		// Among all beacons scanned and saved, now we will take the nearest 3 ones to apply trilateration afterwards:
		for (var i in _sortedList) // We are iterating over _sortedList's properties, that is, in this case, the indexes, e.g. 0,1,2,...
		{
			var beacon = _sortedList[i];
			if (_nearestbeacons.length < 3) {
				if (getFloor(uint8ArrayToString(beacon.bid)) == _currentfloor) {
					_nearestbeacons.push(beacon);
					// console.log("nearest beacon inserted:" + uint8ArrayToString(beacon.bid));
				} // END if
			} else {
				break;
			}
		} // END for
		callback();
	}

	// This functions captures the elements from the GUI layer, draws whatever it has to draw, changes the visibility of some object and it performs the corresponding changes.
	// The GUI is updated.
	function updateGUI() {
		// Now we draw the SVG point and the corresponding label too:
		var svg_circle_source = document.getElementById("svg_circle_sourcepoint");
		var label_you = document.getElementById("p_you");
		// If the values computed are not good enough values or strange values, we show the last known accurate position of that point, but
		// we will make it grayscale to make the user realize that is an old reading:
		if (_real_X === Infinity || _real_X === -Infinity || isNaN(_real_X) || _real_X === undefined ||
		_real_Y === Infinity || _real_Y === -Infinity || isNaN(_real_Y) || _real_Y === undefined) {
			// svg_circle_source.style.visibility = "hidden"; // This hides the point out from user's sight
			// svg_circle_source.style.visibility = "hidden"; // This hides the point out from user's sight
			// label_you.style.visibility = "hidden"; // This hides the point out from user's sight
			// label_you.style.visibility = "hidden"; // This hides the point out from user's sight
			svg_circle_source.style.WebkitFilter="grayscale(100%)";
			label_you.style.backgroundColor = "gray";
			svg_circle_source.style.left = _lastKnownXcoordinate - 35 +"px"; // '35' is the radius of the circle's image declared at map.html. It is necessary to make the circle centered.
			svg_circle_source.style.top = _lastKnownYcoordinate - 35 +"px"; // '35' is the radius of the circle's image declared at map.html. It is necessary to make the circle centered.
			label_you.style.left=_lastKnownXcoordinate - 80 +"px";
			label_you.style.top=_lastKnownYcoordinate + 40 +"px";
		} else {
			showYOUlabel();
			// svg_circle_source.setAttribute("cx", parseInt(_real_X)); esto habia antes de quitar el SVG circle
			// svg_circle_source.setAttribute("cy", parseInt(_real_Y)); esto habia antes de quitar el SVG circle
			svg_circle_source.style.WebkitFilter="none";
			label_you.style.backgroundColor = "red";
			svg_circle_source.style.left = _real_X - 35 +"px"; // '35' is the radius of the circle's image declared at map.html. It is necessary to make the circle centered.
			svg_circle_source.style.top = _real_Y - 35 +"px"; // '35' is the radius of the circle's image declared at map.html. It is necessary to make the circle centered.
			label_you.style.left=_real_X - 80 +"px";
			label_you.style.top=_real_Y + 40 +"px";
			_lastKnownXcoordinate = _real_X;
			_lastKnownYcoordinate = _real_Y;
		}
		// console.log("(X = "+X+",Y = "+Y+")");
		// console.log("(b1X:"+_b1X+",b1Y:"+_b1Y+")");
		// console.log("(realX = "+_real_X+",realY = "+_real_Y+")"); // ESto estaba antes sin comentar

		// We calculate the distance from device's position to destination point. The calculated distance is shown in meters.
		var p_dist = document.getElementById("p_distanceTillDest");
		var distance = (Math.sqrt(Math.pow((_real_X-_destX),2)+Math.pow((_real_Y-_destY),2))/26).toFixed();
		if (isNaN(distance)) {
			p_dist.innerHTML = "?" + " m"
		} else {
			p_dist.innerHTML = distance + " m";
		}
	}

	// Computes the trilateration formula given three beacons and their corresponding distances.
	function computeTrilateration(callback) {
		// Now we retrieve the real coordinates of each beacon for the trilateration formula:
		for (j in _nearestbeacons) {
			retrieveBeacon(uint8ArrayToString(_nearestbeacons[j].bid), j); // The retrieval and assignment of the coordinates is done within the "retrieveBeacon" database function
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
		var X = (Math.pow(htmlBeaconDistance(_nearestbeacons[0]),2) - Math.pow(htmlBeaconDistance(_nearestbeacons[1]),2) + Math.pow(new_b2X,2))/(2*new_b2X);
		var Y = ((Math.pow(htmlBeaconDistance(_nearestbeacons[0]),2) - Math.pow(htmlBeaconDistance(_nearestbeacons[2]),2) + Math.pow(new_b3X,2) + Math.pow(new_b3Y,2)) / (2*new_b3Y)) - (X*new_b3X/new_b3Y);
		// So far, X and Y coordinates shows the solution point for the three beacons placed around the origin of coordinates (0,0).
		// Now we have to translate the beacons matching them with the reality. The only thing to do here is to add the values of the coordinates of the original beacon we placed on (0,0)
		var _real_X = parseFloat(_b1X) + parseFloat(X); // This represents the X coordinate of the locatin of the person (device)
		var _real_Y = parseFloat(_b1Y) + parseFloat(Y); // This represents the Y coordinate of the locatin of the person (device)

		callback();
	}

	// When the user is in another floor different to the room's floor, then we have to load two maps to let the user switch between them.
	function duplicateMaps(_currentfloor){
		setTimeout(function() {
			_stopLoop = true;
			// Now we will write the appropiate label to let the user know whether he/she has to go upstairs or downstairs:
			// var p_upstairs_downstairs = document.getElementById("p_upstairs_downstairs");
			// if (_currentfloor < _floor) {p_upstairs_downstairs.innerHTML="Go upstairs!";} else {p_upstairs_downstairs.innerHTML="Go downstairs!";}
			retrieveMap(_currentfloor.toString()); // If I take this call out of setTimeout function, JavaScripts yields errors.
		},0)
	}

	// This function applies the trilateration technique based on the location of at least three beacons and the floor which the user is at.
	// NOTICE that there are several calls to different functions. This is done like that becasue we wanted to take advantage of CALLBACK functions to make sure
	// JavaScript executes everything synchronously.
	function applyTrilateration() {
		_currentfloor = estimateFloor();
		// We check whether the floor the user is at is equal to the floor of the room we are searching.
		// If both floors are different, then, we will let the user switch between both floors so as to be able
		// to see the room's location as well as user's location. Thus, you will be informed on how to get to your room.
		// We check also the '_stopLoop' variable to prevent unnecesary processing time (e.g.loading the map each 500ms).
		// "!isNan(_currentfloor)" checks if there are beacons readings.
		checkIfUserAtTheSameFloor(function () {
			// Among all beacons scanned and saved, now we will take the nearest 3 ones to apply trilateration afterwards.
			retrieveNearestThreeBeacons(function() {
				// The following step is to compute/calculate the trilateration mathematical formula for real:
				computeTrilateration(function() {
					// Now we update the elements over the GUI:
					updateGUI();
				});
			})
		})
	}
