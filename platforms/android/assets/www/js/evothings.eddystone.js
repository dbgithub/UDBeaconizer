	// ORIGINAL UUID for easiBeacon beacons in iBeacon standard:
	// UUID: A7AE2EB7-1F00-4168-B99B-A749BAC1CA64

	// GLOBAL VARIABLES
	var beacons = {}; // Dictionary of beacons.
	var undefinedCounter = 0; // It counts how many "undefined" values we get at least from one of the beacons. This counter works as an estimate to determine whether the readings from the beacons are weak or even
	// if there are not beacons readings at all. The latter case means that there are not beacons around or that there exist a lot of interferences.

	// SpliTech 2017 performance and accuracy meassurement variables:
	//var euclideanD = []; // Array for testing the offset between the real person position and the estimated point (paper purpose for SpliTech2017)
	//var setpin = true; // Boolean for testing the offset between the real person position and the estimated point (paper purpose for SpliTech2017)


	function startScan() {
		console.log('Scan in progress.');
		beacons = {}; // Reset the dictionary containing all detected/scanned beacons
		_beaconsDistances = {}; // Reset. An object containing a set of 5 measured distances for every beacon.
		_lastKnownBeaconsDistances = {}; // Reset. This object contains a set of three beacons with their respective last known correct and appropiate distances. This is used to avoid NaN values in trilateration.
		_lastKnown5locations = [] // Reset. An object that contains a set of 5 last-known locations (of the user) in the form of {X,Y} coordinates.
		undefinedCounter = 0; // Reseting value. It counts how many "undefined" values we get at least from a beacon.
		evothings.eddystone.startScan(
			function(beacon)
			{
				// Update beacon data.
				beacon.timeStamp = Date.now();
				beacons[beacon.address] = beacon;
				console.log("----------------------------------------------------------------------------- Beacon SCANNED and ADDED: " + beacon.address );
			},
			function(error)
			{
				console.log('Eddystone scan error: ' + JSON.stringify(error));
			});
		}

	// Map the RSSI value to a value between 1 and 100.
	function mapBeaconRSSI(rssi)	{
		if (rssi >= 0) return 1; // Unknown RSSI maps to 1.
		if (rssi < -100) return 100; // Max RSSI
		return 100 + rssi;
	}

	// Filters out the list of ALL beacons scanned and captured giving as an output a list already filtered with our beacons NAMESPACE.
	// Thus, making sure the beacons in the output list are our own beacons.
	function getSortedBeaconList()	{
		var beaconList = [];
		for (var key in beacons)
		{
			// We check that the beacon we insert in the array is one of our beacons and not other company's one as well as it's not corrupted:
			if (beacons[key] != null && beacons[key] !== undefined && uint8ArrayToString(beacons[key].nid) == "a7ae2eb7a749bac1ca64") { // Apparently, namespace ID has to be compared in lowercase values
				console.log("Pool of beacons. Address: " + key);
				beaconList.push(beacons[key]);
				if (_frequencyHistogram[uint8ArrayToString(beacons[key].bid)] == undefined) {_frequencyHistogram[uint8ArrayToString(beacons[key].bid)] = {instance:uint8ArrayToString(beacons[key].bid), n: 0};} else {_frequencyHistogram[uint8ArrayToString(beacons[key].bid)].n += 1;}
				console.log("frequencyHistogram["+uint8ArrayToString(beacons[key].bid)+"].n = " + _frequencyHistogram[uint8ArrayToString(beacons[key].bid)].n);
			}
		}
		if (beaconList.length == 0) {
			// Firstly, we check whether the beacons are reachable or not. If we are not receiving signals from the beacons we will let the user know.
			console.log("undefinedCounter = " + undefinedCounter);
			if (undefinedCounter != -1) {
				undefinedCounter++;
				if (undefinedCounter == 16) {showToolTip('You might be experimenting some interferences! Beacons might not be reachable! :('); return null;}  // If 16 consecutive frames are not received, we warn the user.
				if (undefinedCounter == 20) {_allowYOUlabel = false; updateYOUlabel(); return null;} // If 20 consecutive frames are not received, we make dissapear the 'YOU' label and source point.
				if (undefinedCounter < 20) {_real_X=undefined; _real_Y=undefined; updateGUI();} // We want to show the user's last known position in gray scale.
				if (undefinedCounter == 28) { // If 28 consecutive frames are not received, we warn the user and force him/her to accept the message dialog.
					undefinedCounter = -1;
					_allowYOUlabel = false;
					parenLasRotativas();
					_blestatusTimerID = setInterval(checkBLEStatus, 1000);
					if (!_showingDialog) {
						_showingDialog = true;
						navigator.notification.alert("It seems that you are experimenting strong interferences. No data readings " +
						"are received, make sure you have the Bluetooth feature enabled in your device " +
						" and ensure you are inside the building! :)", function() {
							_showingDialog = false;
							bluetoothSerial.enable(function(){console.log("The user enabled Bluetooth in purpose");}, function(){console.log("The user declined enabling Bluetooth");})
						}, "Serious interferences :(", "Oki Doki!");
					}
					return null;
				}
				return null;
			}
		} else {
			undefinedCounter = 0; // The counter is reset in case the contact with the beacons is again lost.
			// Next step is sorting our own beacons based on RSSI strength
			beaconList.sort(function(beacon1, beacon2)
			{
				return mapBeaconRSSI(beacon1.rssi) < mapBeaconRSSI(beacon2.rssi);
			});
			return beaconList;
		}
	}

	// Removes beacons older than 10 seconds (readings not received) from the beacons' dictionary
	function removeOldBeacons()	{
		var timeNow = Date.now();
		for (var key in beacons)
		{
			// Only keep beacons updated during the last 10 seconds.
			var beacon = beacons[key];
			if (beacon.timeStamp + 10000 < timeNow)
			{
				// console.log("Beacon REMOVED: " + key);
				delete beacons[key];
			}
		}
	}

	// Cleans/Clears out the readings stored in this array.
	function clearOutFrequencyHistogram() {
		_frequencyHistogram = [];
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
		if (beacon.rssi >= 0) {return -1;}
		//console.log("beacon.rssi (" + uint8ArrayToString(beacon.bid) + ") = " + beacon.rssi*1.0);
		//console.log("beacon.txPower (" + uint8ArrayToString(beacon.bid) + ") = " + beacon.txPower);
		var ratio = (beacon.rssi*1.0)/(beacon.txPower-41); // 'beacon.txPower-41' represents the transmission power loss within 1 m.
		_allowYOUlabel = true; // Now we allow the red label YOU that indicates the source point in the map (the user's position). We allow it to be shown now because at this point we know that there exist a communication with the beacons.

		// The distance estimate is calculated as follows:
		if (ratio < 1.0) {
			return Math.pow(ratio, 10).toFixed(2);
		} else {
			var accuracy = ((0.89976)*Math.pow(ratio,7.7095)) + 0.111;
			accuracy = parseFloat(accuracy.toFixed(2));
			if (_beaconsDistances[beacon.address] === undefined || _lastKnownBeaconsDistances[beacon.address] === undefined) {_beaconsDistances[beacon.address] = []; _lastKnownBeaconsDistances[beacon.address] = 0;}
			// console.log("_beaconsDistances["+instancenum+"]= " +_beaconsDistances[beacon.address].length); // Esto estaba antes sin comentar
			// console.log("_lastKnownBeaconsDistances["+instancenum+"]= " +_lastKnownBeaconsDistances[beacon.address]); // Esto estaba antes sin comentar
			if (_beaconsDistances[beacon.address].length < 7) {
				_beaconsDistances[beacon.address].push(accuracy);
				_radii[beacon.address] = _lastKnownBeaconsDistances[beacon.address];
				return _lastKnownBeaconsDistances[beacon.address];
			} else {
				return calculateAverageDistance(beacon.address);
			}
		}
	}

	///////////////////////////////////////////
	// MY OWN FUNCTIONS:
	///////////////////////////////////////////

	// This function triggers all the business logic related to locating the user in a given floor. This can be considered as the MAIN function.
	function locateUser() {
		// Evothings.eddystone.js: 'timer' is the ID that identifies the timer created by "setInterval".
		_trilaterationTimerID = null;
		_beaconRemoverTimerID = null;
		_frequencyHistogramTimerID = null;
		setTimeout(startScan, 500); // Start tracking beacons!
		// Timers for different purposes:
		_trilaterationTimerID = setInterval(applyTrilateration, 500);
		_beaconRemoverTimerID = setInterval(removeOldBeacons, 5000);
		_frequencyHistogramTimerID = setInterval(clearOutFrequencyHistogram, 30000);
		_watchIDaccelerometer = navigator.accelerometer.watchAcceleration(onSuccessAccelerometer,function () {console.log("ERROR reading values from accelerometer");},{frequency:3000});
	}

	// Calculate an average of measured distances of the beacon passed as a parameter.
	// It discards outliers (values too high or too low)
	function calculateAverageDistance(mac) {
		// Firstly, we remove the outliers (or the values that are the biggest/smallest ones even if they are slightly bigger/smaller):
		_beaconsDistances[mac].sort(function(a, b){return b-a}); // The array is sorted by size: from BIG to SMALL
		//  console.log(_beaconsDistances[mac][0] + " | " + _beaconsDistances[mac][1] + " | " + _beaconsDistances[mac][2] + " | " + _beaconsDistances[mac][3] + " | " + _beaconsDistances[mac][4] + " | " + _beaconsDistances[mac][5] + " | " + _beaconsDistances[mac][6] );
		_beaconsDistances[mac].shift(); // The first (biggest) value is removed from the array
		_beaconsDistances[mac].pop(); // The last (smallest) value is removed from the array
		// Now we compute an average among the values that remain in the array:
		var average = 0;
		var n = _beaconsDistances[mac].length;
		for (k = 0; k < n; k++) {
			average += _beaconsDistances[mac][k];
		} // END for
		// console.log("Average:" + (average/n).toFixed(2));
		var resul = parseFloat((average/n).toFixed(2));
		_lastKnownBeaconsDistances[mac] = resul;
		_radii[mac] = resul;
		return resul;
	}

	// It returns the floor the beacon is at, physically speaking.
	function getFloor(instance) {
		return parseInt(instance.substring(0, 6));
	}

	// It estimates and returns the floor number the user is at based on an average upon the information provided by all the beacons.
	// For instance, if the user gets the following values representing the floor from the beacons: 2 + 2 + 1, it means that two of them are in the 2nd floor whereas there is another one in the 1st floor. The average estimates that the user is at 2nd floor.
	function estimateFloor() {
		// At this point, after the call to the following function, all the beacons from the list will be our own beacons. Not any other BLE device.
		_sortedList = getSortedBeaconList(); // a list of beacons sorted by signal strength and NAMESPACE number.
		if (_sortedList == null) {return null;} // There has to be a way to stop the process of trilateration calculation when there are NOT readings from beacons. When the later happens, '_sortedList' will be null, hece, we return null and we will stop the process in the calling method.
		// We iterate over all the beacons in the list and we will estimate the floor the user is at based on the AVERAGE of the same amount of beacons which are in the same floor
		var sum = 0;
		for (var i in _sortedList) // We are iterating over _sortedList's properties, that is, in this case, the indexes, e.g. 0,1,2,...
		{
			var beacon = _sortedList[i];
			var instance = uint8ArrayToString(beacon.bid); // The instance is 6 bytes long represented as Hexadecimal. An Hexadecimal represents 4bits, hence the instance is 12 characters long (48bits divided by 4bits)
			var floor = getFloor(instance);
			//TODO: if (i == 0 || i == 1 || i == 2) {floor = 2;}
			sum += floor; // We will sum all the floor numbers captured from all beacons, we will calculate an average of it and we eventually conclude the floor the user is at
		}
		return Math.round((sum/_sortedList.length).toFixed(4)); // current floor
	}

	// Checks whether the user with his/her smartphone is at the exact floor where the beacons are.
	// If the user is at the SAME floor, then, we will update the GUI accordingly.
	// If the user IS NOT at the same floor, then, we will let him/her know about it.
	// We check also the '_stopLoop' variable to prevent unnecesary processing time (e.g.loading the map each 500ms).
	function checkIfUserAtTheSameFloor(callback) {
		console.log("user floor = " + _floor + " | beacons floor = " + _currentfloor + " | stopLoop = " +_stop);
		if (_floor != _currentfloor && !_stop) { // This will occur if the user and the room are in different floors.
			$("#spa_map #footer > img:first-child").addClass("anima_magician");
			$("#floor_label").addClass("anima_magician");
			_sameFloor = false; // A boolean indicating whether the user is at the same floor as the one he/she is searching for. This works in conjuction with the "_allowYOUlabel" boolean to make the label YOU (source point, user's location) be visible.
			duplicateMaps(_currentfloor);
		} else if (_floor == _currentfloor && _stop) { // This will occur when the user and the room are eventually in the same floor.
			_stop = false;
			_sameFloor = true; // A boolean indicating whether the user is at the same floor as the one he/she is searching for. This works in conjuction with the "_allowYOUlabel" boolean to make the label YOU (source point, user's location) be visible.
			removeDuplicatedMaps();
		} else if (_floor != _currentfloor && _stop) {
			_sameFloor = false; // A boolean indicating whether the user is at the same floor as the one he/she is searching for. This works in conjuction with the "_allowYOUlabel" boolean to make the label YOU (source point, user's location) be visible.
		}
		callback();
	}

	// Inserts the three nearest beacons from the list of all beacons in an array.
	function retrieveNearestThreeBeacons(callback) {
		_radii = {} // reset the object
		// Among all beacons scanned and saved, now we will take the nearest 3 ones to apply trilateration afterwards:
		for (var i in _sortedList) // We are iterating over _sortedList's properties, that is, in this case, the indexes, e.g. 0,1,2,...
		{
			var beacon = _sortedList[i];
			if (_nearestbeacons.length < 3) {
				if (getFloor(uint8ArrayToString(beacon.bid)) == _currentfloor) {
					_nearestbeacons.push(beacon);
					console.log("nearest beacon inserted:" + uint8ArrayToString(beacon.bid));
				} // END if
			} else {
				break;
			}
		} // END for
		callback();
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
		_final_X = parseFloat(_b1X) + parseFloat(X); // This represents the X coordinate of the locatin of the person (device)
		_final_Y = parseFloat(_b1Y) + parseFloat(Y); // This represents the Y coordinate of the locatin of the person (device)
		_nearestbeacons = []; // We empty the array for next iteration
		// console.log("(X = "+X+",Y = "+Y+")");
		// console.log("(b1X:"+_b1X+",b1Y:"+_b1Y+")");
		// console.log("(realX = "+_real_X+",realY = "+_real_Y+")");
		console.log("(final_X = "+_final_X+",final_Y = "+_final_Y+")");


		callback();
	}

	// To make a better precision estimate, it is necessary to calculate the centroid among the three beacons from which we receive most readings.
	function calculateCentroid(callback) {
		// Apart from calculating trilateration between the three nearest beacons. We need to compute the centroid (centroide) of the three beacons from which we have more readings.
		// Not necessary the ones who are nearest. That is, we are not using the same beacons as in this function.
		var temp = [];
		for (index in _frequencyHistogram) {temp.push(_frequencyHistogram[index]);} // Moving all elements from a dictionary of Objects to an array of Objects.
		temp.sort(function(a, b){return b.n-a.n}); // The array is sorted by size: from BIG to SMALL (the sort function is accessing one of the members of the object: 'n')
		temp = temp.slice(0,3);
		_centroid.Xtmp = 0; _centroid.Ytmp = 0; // temporal variables (reseting values)
		retrieveBeaconCoordinates(temp[0].instance);
		retrieveBeaconCoordinates(temp[1].instance);
		retrieveBeaconCoordinates(temp[2].instance);
		_centroid.X = _centroid.X / 3;
		_centroid.Y = _centroid.Y / 3;
		console.log("_centroide final coordinate(X,Y) = " + _centroid.X + ", " + _centroid.Y);

		callback();
	}

	// This is an accuracy function to estimate a better position based on already last-known 5 locations of the user.
	// Instead of drawing directly the position of the user, we will take the last known 5 hypothetical locations of the user and we will narrow down (estimate)
	// a better and more accurate position. The idea behind this algorithm is to calculate the middle-point within the straight line that goes from one location
	// to the other. Now, we enumerate the new calculated points as if they were the original ones, and we repeat the process as much as we want.
	// As a final step, we calculate an average point based on the minimum X and maximum X coordinates of the extreme positions on the map. We do the same with Y.
	// The result will be a (X, Y) coordinates of a better accurate location.
	function funcion_de_precision(callback) {
		var temp = _lastKnown5locations.slice();
		if (_lastKnown5locations.length == 5) {
			// This first loop refers to the NUMBER of times that you want to apply the accuracy function. In this case, FIVE times will be executed.
			// As you increase the frecuency, you get much closer points.
			for (k = 0; k < 5; k++) {
				for (i=0; i<_lastKnown5locations.length; i++) {
					// We calculate now the middle-point that relies on the straight line between one point to the consecutive one:
					var x1 = _lastKnown5locations[i].X;
					var y1 = _lastKnown5locations[i].Y;
					if (i == 4) { // This if statement makes sure that the link between the first point and the last one is also taken into account
						var x2 = _lastKnown5locations[0].X;
						var y2 = _lastKnown5locations[0].Y;
					} else {
						var x2 = _lastKnown5locations[i+1].X;
						var y2 = _lastKnown5locations[i+1].Y;
					}
					var middleX = (x1+x2)/2
					var middleY = (y1+y2)/2
					// console.log("middleX = " + middleX + "; middleY = " + middleY);
					_lastKnown5locations[i] = {X:middleX, Y:middleY}
				}
			}

			// Now, we have to come up with a single coordinate (x,y) which turns out to be the user's location that we have improved:
			// In fact, we want again to compute the middle-point that relies between the coordinates of the extreme locations. That is, the ones that are on the extremes.
			// We will do that for variable X and Y. To do so, we have to iterate over the locations that we have narrowed down to retrieve the extremes.
			var Xcollection = [];
			var Ycollection = [];
			for (l in _lastKnown5locations) {
				Xcollection.push(_lastKnown5locations[l].X)
				Ycollection.push(_lastKnown5locations[l].Y)
			}
			// console.log("Size of Xcollection: "+ Xcollection.length + " | Size of Ycollection: " + Ycollection.length);
			Xcollection.sort(function(a, b){return b-a}); // The array is sorted by size: from BIG to SMALL
			Ycollection.sort(function(a, b){return b-a}); // The array is sorted by size: from BIG to SMALL
			var maxX = Xcollection.shift(); // The first (biggest) value is removed from the array
			var minX = Xcollection.pop(); // The last (smallest) value is removed from the array
			var maxY = Ycollection.shift(); // The first (biggest) value is removed from the array
			var minY = Ycollection.pop(); // The last (smallest) value is removed from the array
			_real_X = (maxX + minX)/2;
			_real_Y = (maxY + minY)/2;

			_lastKnown5locations = temp.slice();
			_lastKnown5locations.shift();
			_lastKnown5locations.push({X:_final_X, Y:_final_Y})
		} else {
			if (_final_X !== Infinity && _final_X !== -Infinity && !isNaN(_final_X) && _final_X !== undefined &&
			_final_Y !== Infinity && _final_Y !== -Infinity && !isNaN(_final_Y) && _final_Y !== undefined) {
				// console.log("Pushed values: " + _final_X + " | " + _final_Y);
				_lastKnown5locations.push({X:_final_X, Y:_final_Y})
			}
		}
		callback();
	}

	// This is the correction function that prevents the user's position estimated points from being drawn in a ilogical location on the map.
	// For instance, the user cannot be positioned outside the building's walls, in fact, that's a use case that we can be sure about.
	// In this switch, depending on which floor the user is at, I restrict/delimit the X and Y axises so that the point is not drawn outside any
	// specific limit that we want to avoid.
	// The algorithm/switch is based upon severales rules taking into account the X and Y axises. First, the most restrictive rules are set,
	// and then, the less restrictive.
	function funcion_de_coreccion(callback) {
		if (_real_X !== Infinity && _real_X !== -Infinity && !isNaN(_real_X) && _real_X !== undefined &&
		_real_Y !== Infinity && _real_Y !== -Infinity && !isNaN(_real_Y) && _real_Y !== undefined) {

			// Taking the centroid into account, we will trace/draw a circle with a radius value to determine.
			// The estimated point should fall into the specified circle to be depicted on the map, otherwise it will not be displayed.
			// The radius value is really linked to the image resolution used as a map:
			if (_centroid.X !== undefined && _centroid.Y !== undefined) {
				if ((_real_X > _centroid.X + _centroidRadius) || (_real_X < _centroid.X - _centroidRadius) ||
				(_real_Y > _centroid.Y + _centroidRadius) || (_real_Y < _centroid.Y - _centroidRadius)) {
					console.log("Parece que se encuentra fuera del radio del centroide! (realX = "+_real_X+",realY = "+_real_Y+")");
					_real_X = undefined;
					_real_Y = undefined;
					callback();
					return;
				}
			}

			var offset = 200; // Offset of 200px
			switch(_currentfloor) {
				case 0:
				console.log("switch: caso 0");
				var limit = 780 + offset;
				if (780 <= _real_Y && _real_Y <= limit && 441 <= _real_X && _real_X <= 2204) {_real_Y = 780;break;}
				var limit = 441 + offset;
				if (441 <= _real_X && _real_X <= limit && 780 <= _real_Y) {_real_X = 441; break;}
				if (_real_Y <= 153) {_real_Y = 153; break;}
				if (_real_X <= 51) {_real_X = 51; break;}
				break;
				case 1:
				console.log("switch: caso 1");
				var limit = 480 + offset;
				if (480 <= _real_Y && _real_Y <= limit && 1089 <= _real_X && _real_X <= 1563) {_real_Y = 480;break;}
				var limit = 1089 + offset;
				if (1089 <= _real_X && _real_X <= limit && 480 <= _real_Y && _real_Y<= 774) {_real_X = 1089; break;}
				var limit = 1563 - offset;
				if (limit <= _real_X && _real_X<= 1563 && 480 <= _real_Y && _real_Y<= 774) {_real_X = 1563; break;}
				var limit = 774 + offset;
				if (774 <= _real_Y && _real_Y <= limit && 450 <= _real_X && _real_X <= 1089) {_real_Y = 774; break;}
				var limit = 450 + offset;
				if (450 <= _real_X && _real_X <= limit && 774 <= _real_Y && _real_Y<= 1488) {_real_X = 450; break;}
				var limit = 774 + offset;
				if (774 <= _real_Y && _real_Y <= limit && 1563 <= _real_X && _real_X<= 2214) {_real_Y = 774; break;}
				var limit = 2214 - offset;
				if (limit <= _real_Y && _real_Y<= 2214 && 774 <= _real_Y && _real_Y<= 1488) {_real_X = 2214; break;}
				if (_real_Y <= 162) {_real_Y = 162; break;}
				if (_real_Y >= 1488) {_real_Y = 1488; break;}
				break;
				case 2:
				console.log("switch: caso 2");
				var limit = 465 + offset;
				if (465 <= _real_Y && _real_Y <= limit && 1083 <= _real_X && _real_X <= 1563) {_real_Y = 465;break;}
				var limit = 1083 + offset;
				if (1083 <= _real_X && _real_X <= limit && 465 <= _real_Y && _real_Y<= 756) {_real_X = 1083; break;}
				var limit = 1563 - offset;
				if (limit <= _real_X && _real_X<= 1563 && 465 <= _real_Y && _real_Y<= 756) {_real_X = 1563; break;}
				var limit = 756 + offset;
				if (756 <= _real_Y && _real_Y <= limit && 450 <= _real_X && _real_X <= 1083) {_real_Y = 756; break;}
				var limit = 450 + offset;
				if (450 <= _real_X && _real_X <= limit && 756 <= _real_Y && _real_Y<= 1458) {_real_X = 450; break;}
				var limit = 756 + offset;
				if (756 <= _real_Y && _real_Y <= limit && 1563 <= _real_X && _real_X<= 2205) {_real_Y = 756; break;}
				var limit = 2205 - offset;
				if (limit <= _real_Y && _real_Y<= 2205 && 756 <= _real_Y && _real_Y<= 1458) {_real_X = 2205; break;}
				if (_real_Y <= 150) {_real_Y = 150; break;}
				if (_real_Y >= 1458) {_real_Y = 1458; break;}
				break;
				case 3:
				console.log("switch: caso 3");
				var limit = 468 + offset;
				if (468 <= _real_Y && _real_Y <= limit && 1068 <= _real_X && _real_X <= 1545) {_real_Y = 468;break;}
				var limit = 1068 + offset;
				if (1068 <= _real_X && _real_X <= limit && 468 <= _real_Y && _real_Y<= 762) {_real_X = 1068; break;}
				var limit = 1545 - offset;
				if (limit <= _real_X && _real_X<= 1545 && 468 <= _real_Y && _real_Y<= 762) {_real_X = 1545; break;}
				var limit = 762 + offset;
				if (762 <= _real_Y && _real_Y <= limit && 435 <= _real_X && _real_X <= 1068) {_real_Y = 762; break;}
				var limit = 435 + offset;
				if (435 <= _real_X && _real_X <= limit && 762 <= _real_Y && _real_Y<= 1473) {_real_X = 435; break;}
				var limit = 762 + offset;
				if (762 <= _real_Y && _real_Y <= limit && 1545 <= _real_X && _real_X<= 2190) {_real_Y = 762; break;}
				var limit = 2190 - offset;
				if (limit <= _real_Y && _real_Y<= 2190 && 762 <= _real_Y && _real_Y<= 1473) {_real_X = 2190; break;}
				if (_real_Y <= 141) {_real_Y = 141; break;}
				if (_real_Y >= 1473) {_real_Y = 1473; break;}
				break;
				case 4:
				console.log("switch: caso 4");
				var limit = 477 + offset;
				if (477 <= _real_Y && _real_Y <= limit && 1092 <= _real_X && _real_X <= 1557) {_real_Y = 477; console.log("caso a");break;}
				var limit = 1092 + offset;
				if (1092 <= _real_X && _real_X <= limit && 477 <= _real_Y && _real_Y<= 762) {_real_X = 1092; console.log("caso b");break;}
				var limit = 1557 - offset;
				if (limit <= _real_X && _real_X<= 1557 && 477 <= _real_Y && _real_Y<= 762) {_real_X = 1557; console.log("caso c");break;}
				var limit = 762 + offset;
				if (762 <= _real_Y && _real_Y <= limit && 465 <= _real_X && _real_X <= 1092) {_real_Y = 762; console.log("caso d");break;}
				var limit = 465 + offset;
				if (465 <= _real_X && _real_X <= limit && 762 <= _real_Y && _real_Y<= 1485) {_real_X = 465; console.log("caso e");break;}
				var limit = 762 + offset;
				if (762 <= _real_Y && _real_Y <= limit && 1557 <= _real_X && _real_X<= 2202) {_real_Y = 762; console.log("caso f");break;}
				var limit = 2202 - offset;
				if (limit <= _real_Y && _real_Y<= 2202 && 762 <= _real_Y && _real_Y<= 1485) {_real_X = 2202; console.log("caso g");break;}
				if (_real_Y <= 162) {_real_Y = 162; console.log("caso h");break;}
				if (_real_Y >= 1485) {_real_Y = 1485; console.log("caso i"); break;}
				break;
				case 5:
				console.log("switch: caso 5");
				var limit = 465 + offset;
				if (465 <= _real_Y && _real_Y <= limit && 1086 <= _real_X && _real_X <= 1554) {_real_Y = 465;break;}
				var limit = 1086 + offset;
				if (1086 <= _real_X && _real_X <= limit && 465 <= _real_Y && _real_Y<= 693) {_real_X = 1086; break;}
				var limit = 1554 - offset;
				if (limit <= _real_X && _real_X<= 1554 && 465 <= _real_Y && _real_Y<= 693) {_real_X = 1554; break;}
				var limit = 693 + offset;
				if (693 <= _real_Y && _real_Y <= limit && 399 <= _real_X && _real_X <= 1086) {_real_Y = 693; break;}
				var limit = 399 + offset;
				if (399 <= _real_X && _real_X <= limit && 693 <= _real_Y && _real_Y<= 1434) {_real_X = 399; break;}
				var limit = 693 + offset;
				if (693 <= _real_Y && _real_Y <= limit && 1554 <= _real_X && _real_X<= 2247) {_real_Y = 693; break;}
				var limit = 2247 - offset;
				if (limit <= _real_Y && _real_Y<= 2247 && 693 <= _real_Y && _real_Y<= 1434) {_real_X = 2247; break;}
				if (_real_Y <= 210) {_real_Y = 210; break;}
				if (_real_Y >= 1434) {_real_Y = 1434; break;}
				if (_real_X <= 135) {_real_X = 135; break;}
				if (_real_X >= 2520) {_real_X = 2520; break;}
				break;
				default:
				break;
			}
			//console.log("(realX = "+_real_X+",realY = "+_real_Y+")");

					// SpliTech2017 statistic purpose code (metrics):
						// Testing the offset between the real person position and the estimated point (paper purpose for SpliTech2017):
						/*
						console.log("(realX = "+_real_X+",realY = "+_real_Y+") || Euclidean distance to estimated points: " + (Math.sqrt(Math.pow(1842-_real_X,2) + Math.pow(320-_real_Y,2)))/25);
						if (euclideanD.length >= 80 && setpin) {
							setpin = false;
							console.log("Euclidean 80!");
							// Calculate now the average:
							var sum = euclideanD.reduce(function(sum, value){
								return sum + value;
							}, 0);
							var avg = sum / euclideanD.length;
							console.log("AVG = " + avg);
							//////////////////////////////////////////////
							// Calculate now the differences between the values and their square values:
							var diffs = euclideanD.map(function(value){
								var diff = value - avg;
								var sqr = diff * diff;
								return sqr;
							});
							// Now calculate the averagge again of those values:
							var sum2 = diffs.reduce(function(sum2, value){
								return sum2 + value;
							}, 0);

							var avg2 = sum2 / diffs.length;
							// Now we calculate the square root of the average:
							var SD = Math.sqrt(avg2);
							console.log("Standard Deviation = " + SD);
						} else {
							euclideanD.push((Math.sqrt(Math.pow(1842-_real_X,2) + Math.pow(320-_real_Y,2)))/25);
						}*/
		}
		callback();
	}

	// Based on a flag (true or false), it computes an average of the estimated positions to make the estimate as still as possible.
	// We want it to be motionless because based on the flag, the user is supposed to not to be in motion.
	function computeAccelerometerAvg(callback) {
		if (_deviceMotionless) {
		  if (_real_X !== Infinity && _real_X !== -Infinity && !isNaN(_real_X) && _real_X !== undefined &&
		  _real_Y !== Infinity && _real_Y !== -Infinity && !isNaN(_real_Y) && _real_Y !== undefined) { 
			_avgEstimateAccelerometer.counter++;
			_avgEstimateAccelerometer.x = (_avgEstimateAccelerometer.x + _real_X);
			_avgEstimateAccelerometer.y = (_avgEstimateAccelerometer.y + _real_Y);
			console.log("_avgEstimateAccelerometer.counter = " + _avgEstimateAccelerometer.counter);
			console.log("_avgEstimateAccelerometer.x = " + _avgEstimateAccelerometer.x);
			console.log("_avgEstimateAccelerometer.y = " + _avgEstimateAccelerometer.y);
			_real_X = _avgEstimateAccelerometer.x / _avgEstimateAccelerometer.counter;
			_real_Y = _avgEstimateAccelerometer.y / _avgEstimateAccelerometer.counter;
			console.log("(realX = "+_real_X+",realY = "+_real_Y+")");
		 }
		}
		callback();
	}
	// This functions captures the elements from the GUI layer, draws whatever it has to draw, changes the visibility of some object and it performs the corresponding changes.
	// The GUI is updated.
	function updateGUI() {
		// Now we draw the user's location point and the corresponding label too:
		var youPoint_circle = document.getElementById("youPoint_circle");
		var you_label = document.getElementById("p_you_label");
		var circulito = document.getElementById("youPoint_SVG_circle"); // This is the SVG circle inside SVG tag
		var circulito2 = document.getElementById("youPoint_SVG_circle2"); // This is the SVG little circle inside SVG tag
		// Setting (calculating) the radius of the YOU circle. We will iterate over all radii values and take the biggest one.
		var radius = 30; // '30' is a number that I set it on my own judge, it's considered sort of a minimum value. It does not relate to any variable somewhere else.
		for (l in _radii) {
			if (_radii[l] > 400) {continue;} // We wouldn't like to exceed more than 400px, otherwise the circle would be extremely large!
			radius = Math.max(radius, _radii[l]);
		}
		// If the values computed are not good enough values or strange values, we show the last known accurate position of that point, but
		// we will make it grayscale to make the user realize that is an old reading:
		if (_real_X === Infinity || _real_X === -Infinity || isNaN(_real_X) || _real_X === undefined ||
		_real_Y === Infinity || _real_Y === -Infinity || isNaN(_real_Y) || _real_Y === undefined) {
			youPoint_circle.style.WebkitFilter="grayscale(100%) blur(30px)";
			you_label.style.backgroundColor = "gray";
			youPoint_circle.style.left = _lastKnownXcoordinate - (radius*5)/2 + _paddingMap +"px"; // '(radius*5)/2' is the radius of the circle's image. It is necessary to make the circle centered.
			youPoint_circle.style.top = _lastKnownYcoordinate - (radius*5)/2+ _paddingMap +"px"; // '(radius*5)/2' is the radius of the circle's image. It is necessary to make the circle centered.
			you_label.style.left=_lastKnownXcoordinate + (radius*4.8)/2 + _paddingMap +"px";
			you_label.style.top=_lastKnownYcoordinate + (radius*4.8)/2 +_paddingMap +"px";

		} else {
			updateYOUlabel();
			youPoint_circle.style.WebkitFilter="grayscale(0%) blur(15px)";
			you_label.style.backgroundColor = "red";
			youPoint_circle.style.left = _real_X - (radius*5)/2 +_paddingMap +"px"; // '(radius*5)/2' is the radius of the circle's image. It is necessary to make the circle centered.
			youPoint_circle.style.top = _real_Y - (radius*5)/2 + _paddingMap +"px"; // '(radius*5)/2' is the radius of the circle's image. It is necessary to make the circle centered.
			you_label.style.left=_real_X + (radius*4.8)/2 + _paddingMap +"px"; // '4.8' is a number that I set it on my own judge.It does not relate to any variable somewhere else.
			you_label.style.top=_real_Y + (radius*4.8)/2 + _paddingMap +"px"; // '4.8' is a number that I set it on my own judge.It does not relate to any variable somewhere else.
			_lastKnownXcoordinate = _real_X;
			_lastKnownYcoordinate = _real_Y;
		}
		// Common changes:
		youPoint_circle.style.width = (radius*6) + "px"; // '6' is a number that I set it on my own judge.It does not relate to any variable somewhere else.
		youPoint_circle.style.height = (radius*6) + "px"; // '6' is a number that I set it on my own judge. It does not relate to any variable somewhere else.
		circulito.setAttribute("cx", (radius*6)/2 + "px"); // '6' is a number that I set it on my own judge.It does not relate to any variable somewhere else.
		circulito.setAttribute("cy", (radius*6)/2 + "px"); // '6' is a number that I set it on my own judge.It does not relate to any variable somewhere else.
		circulito.setAttribute("r", (radius*5)/2 + "px"); // '5' is a number that I set it on my own judge.It does not relate to any variable somewhere else.
		circulito2.setAttribute("cx", (radius*6)/2 + "px"); // '6' is a number that I set it on my own judge.It does not relate to any variable somewhere else.
		circulito2.setAttribute("cy", (radius*6)/2 + "px"); // '6' is a number that I set it on my own judge.It does not relate to any variable somewhere else.

		// We calculate the distance from device's position to destination point. The calculated distance (Euclidean distance) is shown in meters.
		var p_dist = document.getElementById("p_distanceTillDest");
		var distance = (Math.sqrt(Math.pow((_real_X-_destX),2)+Math.pow((_real_Y-_destY),2))/26).toFixed();
		if (isNaN(distance) || distance == Infinity || distance == -Infinity) {
			p_dist.innerHTML = "?" + " m";
		} else {
			p_dist.innerHTML = distance + " m";
		}
	}

	// onSuccess callback for the watch accelerometer function
	function onSuccessAccelerometer(acceleration) {
		// The following consecutive IF statements calculate the DELTA on acceleretion values from accelerometer:
		if (acceleration.x < 0) {
			if (_previousAccel.x < 0) {
				_deltaAccel.x = acceleration.x - _previousAccel.x;
				_previousAccel.x = acceleration.x;
			} else {_deltaAccel.x = acceleration.x + _previousAccel.x; _previousAccel.x = acceleration.x;}
		} else {
			if (_previousAccel.x < 0) {
				_deltaAccel.x = acceleration.x + _previousAccel.x;
				_previousAccel.x = acceleration.x;
			} else {_deltaAccel.x = acceleration.x - _previousAccel.x; _previousAccel.x = acceleration.x;}
		}
		if (acceleration.y < 0) {
			if (_previousAccel.y < 0) {
				_deltaAccel.y = acceleration.y - _previousAccel.y;
				_previousAccel.y = acceleration.y;
			} else {_deltaAccel.y = acceleration.y + _previousAccel.y; _previousAccel.y = acceleration.y;}
		} else {
			if (_previousAccel.y < 0) {
				_deltaAccel.y = acceleration.y + _previousAccel.y;
				_previousAccel.y = acceleration.y;
			} else {_deltaAccel.y = acceleration.y - _previousAccel.y; _previousAccel.y = acceleration.y;}
		}
		if (acceleration.z < 0) {
			if (_previousAccel.z < 0) {
				_deltaAccel.z = acceleration.z - _previousAccel.z;
				_previousAccel.z = acceleration.z;
			} else {_deltaAccel.z = acceleration.z + _previousAccel.z; _previousAccel.z = acceleration.z;}
		} else {
			if (_previousAccel.z < 0) {
				_deltaAccel.z = acceleration.z + _previousAccel.z;
				_previousAccel.z = acceleration.z;
			} else {_deltaAccel.z = acceleration.z - _previousAccel.z; _previousAccel.z = acceleration.z;}
		}

		console.log('Acceleration (delta) X: ' + Math.abs(_deltaAccel.x) + '\n' +
			  'Acceleration (delta) Y: ' + Math.abs(_deltaAccel.y) + '\n' +
			  'Acceleration (delta) Z: ' + Math.abs(_deltaAccel.z));

		// Now, we check if the DELTA is small enough (in the THREE axises) to trigger the calculus of the average:
		if (_deltaAccel.x < 0.8 && _deltaAccel.y < 0.8 && _deltaAccel.z < 0.8) {	
			_deviceMotionless = true;
			console.log("_deviceMotionless = " + _deviceMotionless);
		} else {
			_deviceMotionless = false;
			_avgEstimateAccelerometer.x = 0; _avgEstimateAccelerometer.y = 0; _avgEstimateAccelerometer.counter = 0;
			console.log("_deviceMotionless = " + _deviceMotionless);
		}


	}
	// When the user is in another floor different to the room's floor, then we have to load two maps to let the user switch between them.
	function duplicateMaps(_currentfloor){
		setTimeout(function() {
			_stop = true;
			// TODO: Now we will write the appropiate label to let the user know whether he/she has to go upstairs or downstairs:
			// var p_upstairs_downstairs = document.getElementById("p_upstairs_downstairs");
			// if (_currentfloor < _floor) {p_upstairs_downstairs.innerHTML="Go upstairs!";} else {p_upstairs_downstairs.innerHTML="Go downstairs!";}
			retrieveMap(_currentfloor.toString(), function() {}); // If I take this call out of setTimeout function, JavaScripts yields errors.
		},0)
	}

	// This function applies the trilateration technique based on the location of at least three beacons and the floor which the user is at.
	// NOTICE that there are several calls to different functions. This is done like that becasue we wanted to take advantage of CALLBACK functions to make sure
	// JavaScript executes everything synchronously.
	function applyTrilateration() {
		_currentfloor = estimateFloor();
		if (_currentfloor == null) {return null;} // There has to be a way to stop the process of trilateration calculation when there are NOT readings from beacons. When the later happens, '_currentfloor' will be null, hece, we prevent the process from cointinuing.
		// We check whether the floor the user is at is equal to the floor of the room we are searching.
		// If both floors are different, then, we will let the user switch between both floors so as to be able
		// to see the room's location as well as user's location. Thus, you will be informed on how to get to your room.
		checkIfUserAtTheSameFloor(function () {
			// Among all beacons scanned and saved, now we will take the nearest 3 ones to apply trilateration afterwards.
			retrieveNearestThreeBeacons(function() {
				// The following step is to compute/calculate the trilateration mathematical formula for real:
				computeTrilateration(function() {
					// We find the centroid among the three beacons from which we receive more readings.
					calculateCentroid(function () {
						// We apply an accuracy function to estimate a better position based on already last-known 5 locations of the user:
						funcion_de_precision(function() {
							// We apply a corrective function that delimits the position of the final point indicating user's position:
							funcion_de_coreccion(function() {
								// If the required flag is set to TRUE, then we estimate that the device is motionless and we proceed to calculate an average of the position estimates to make to red dot as still as possible.
								computeAccelerometerAvg(function() {
									// Now, yes, as the final step, we update the elements over the GUI:
									updateGUI();
								})
							})
						})
					})
				})
			})
		})
		// displayBeacons();
	}

	// Stops the scanning process of BLE devices
	// Resets the IDs for the Intervals that were launched to calculate trilateration
	function parenLasRotativas() {
		evothings.eddystone.stopScan(); // we stop the scan because is not needed anymore
		clearInterval(_trilaterationTimerID); // In case we go back from Map page, this is to avoid applying trilateration forever.
		clearInterval(_beaconRemoverTimerID); // This stops the process of removing the old beacons from time to time.
		clearInterval(_frequencyHistogramTimerID); // This stops the process of clearing out the frequency histogram array for beacon readings
	}

	// Checks if the BLE is enabled, if YES, then we try to locate again the user on the map.
	function checkBLEStatus() {
		// Checking whether Bluetooth feature is enabled or not:
		bluetoothSerial.isEnabled(
			function() {clearInterval(_blestatusTimerID);locateUser();}, function() {console.log("BLE is not enabled in the device!");} // Sucess and failure callbacks
		);
	}
