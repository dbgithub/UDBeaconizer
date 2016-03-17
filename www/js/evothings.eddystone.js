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
				beaconList.push(beacons[key]);
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
			displayBeacons();
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
			var html = '';
			var sortedList = getSortedBeaconList(beacons);
			for (var i = 0; i < sortedList.length; ++i)
			{
				var beacon = sortedList[i];
				var htmlBeacon =
					'<p>'
					+	htmlBeaconName(beacon)
					+	htmlBeaconURL(beacon)
					+ 	htmlBeaconDistance(beacon)
					+	htmlBeaconNID(beacon)
					+	htmlBeaconBID(beacon)
					+	htmlBeaconVoltage(beacon)
					+	htmlBeaconTemperature(beacon)
					+	htmlBeaconRSSI(beacon)
					+ '</p>';
				html += htmlBeacon
			}
			document.querySelector('#test_beacons').innerHTML = html;
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
			var ratio = (beacon.rssi*1.0)/-69; // InsteaD of -69 it should be txPower (that is, the rssi value measured at distance 1m)
			if (ratio < 1.0) {
				return 'Distance: ' + Math.pow(ratio, 10).toFixed(2) + '<br/>';
			} else {
				var accuracy = ((0.89976)*Math.pow(ratio,7.7095)) + 0.111;
				accuracy = accuracy.toFixed(2);
				// return accuracy;
				return 'Distance: ' + accuracy + '<br/>';
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
				result += format(uint8Array[i]) + ' ';
			}
			return result;
		}

		function showMessage(text)
		{
			//document.querySelector('#message').innerHTML = text;
		}
