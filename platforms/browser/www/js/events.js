var searchtimer; // GLOBAL VARIABLE. A timer that executes a certain function when the user stops writing something in the search bar.
var inputValue; // GLOBAL VARIABLE. Value/text introduced by the user
var tooltipTimer; // GLOBAL VARIABLE. Timer for the tooltip functionality. It is used when the user maintains pressure over an object triggering a tooltip explaining the use of that button, action or whatever.

// This function tracks the user when he/she stops writing and makes a query with the text within the bar. It makes sure that white
// spaces don't count as a query. It's a live search meaning that every 1s it checks what is inside the search bar.
function livesearch(text) {
    // var re = /\s/g; // this is a regular expression checking for one or more space characters in the whole string, "g" means global.
    // We are not using it for the moment because "Fulanito menganito" would be detected as a string with a space,
    // hence the search would not be lunched. To test a text accordingly to the regular expressions just: re.test(text)
    text = text.trim().toLowerCase(); // Here we "validate"/filter the input. We avoid "all whitespaces" and empty strings among others.
    // We check whether the input text introduced by the user contains numbers (rooms, offices...) or a simple name:
    if (text.length != 0 && text != "" && !/\d/.test(text)) {
        console.log("LOOKING FOR PERSONA/ROOM!");
        inputValue = text;
        console.log(inputValue);
        if (searchtimer === undefined) {
            searchtimer = setTimeout(searchPeople, 500); // YOU CAN MODIFY the '500' value to make it more responsive. More info about timer at: http://www.w3schools.com/js/js_timing.asp
        } else {
            clearTimeout(searchtimer);
            searchtimer = setTimeout(searchPeople, 500); // YOU CAN MODIFY the '500' value to make it more responsive. More info about timer at: http://www.w3schools.com/js/js_timing.asp
        } // END inside if
    } else if (/\d/.test(text)){ // This is going to happen if the input has a digit among what has been written
        console.log("LOOKING FOR NUMERO!");
        inputValue = text;
        console.log(inputValue);
        if (searchtimer === undefined) {
            searchtimer = setTimeout(searchRoom, 500); // YOU CAN MODIFY the '500' value to make it more responsive. More info about timer at: http://www.w3schools.com/js/js_timing.asp
        } else {
            clearTimeout(searchtimer);
            searchtimer = setTimeout(searchRoom, 500); // YOU CAN MODIFY the '500' value to make it more responsive. More info about timer at: http://www.w3schools.com/js/js_timing.asp
        } // END inside if
    } else {
        // More info about Toast plugin at: https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin
        showToolTip('Please, type anything in the search bar :)');
        clearTimeout(searchtimer);
        hideLiveSearchResults();
    }// END outside if
}

// It hides the live-search-result DOM element and its content
function hideLiveSearchResults() {
    var div = document.getElementById("div_liveSearchResults");
    div.innerHTML = " ";
    div.style.visibility = "hidden";
}

// Searches for the person/people in the database
// We also make a call to "retrieveRoom" because there are some rooms that doesn't contain numbers and therefore are treated as normal strings
function searchPeople() {
    retrievePerson(inputValue);
    retrieveRoom(inputValue, false); // false means that it doesn't show its results because "retrievePerson" is actually handleing it.
}

// Searches for the room in the database
function searchRoom() {
    retrieveRoom(inputValue, true); // true means that it DOES show its results because the search item contains a number
}

// Shows the list of rooms (labs, places) found in the database according to the input text. It's displayed in the live-search-result element from DOM.
function showRoomsList() {
    setTimeout(function() {
        if (_searched_rooms.length != 0) {
            var list = "";
            for (j = 0; j < _searched_rooms.length; j++) {
                list += "<li onclick='goMap("+j+")' ontouchstart='return true;'>" + (_searched_rooms[j])[0].label + "</li>"
            }
            var div = document.getElementById("div_liveSearchResults");
            if (_searched_rooms.length > 6) {
                div.style.boxShadow="0px 1px 10px rgba(0, 0, 0, 0.8), 0px -20px 20px -10px rgba(0, 0, 0, 0.8) inset";
            } else {
                div.style.boxShadow="0px 1px 10px rgba(0, 0, 0, 0.8)";
            }
            div.innerHTML = "<ul>" + list + "</ul>";
            div.style.visibility = "visible";
        } else {
            showToolTip('Not found! Please, try again :)');
            console.log("WARNING: no results found in the database");
            hideLiveSearchResults();
        }
    }, 100);
}

// Shows the list of rooms and staff found in the database according to the input text. It's displayed in the live-search-result element from DOM.
function showBothStaffNRooms() {
    setTimeout(function() {
        console.log("length PEOPLE: " +_searched_people.length); // eliminar esta traza
        console.log("length ROOMS: " +_searched_rooms.length); // eliminar esta traza
        var list = "";
        if (_searched_people.length != 0) {
            for (j = 0; j < _searched_people.length; j++) {
                list += "<li onclick='goContact("+j+")' ontouchstart='return true;'>" + _searched_people[j].name + "</li>"
            }
        }
        if (_searched_rooms.length != 0) {
            for (j = 0; j < _searched_rooms.length; j++) {
                list += "<li onclick='goMap("+j+")' ontouchstart='return true;'>" + (_searched_rooms[j])[0].label + "</li>"
            }
        }
        if (list != "") {
            var div = document.getElementById("div_liveSearchResults");
            if (_searched_people.length + _searched_rooms.length > 6) {
                div.style.boxShadow="0px 1px 10px rgba(0, 0, 0, 0.8), 0px -20px 20px -10px rgba(0, 0, 0, 0.8) inset";
            } else {
                div.style.boxShadow="0px 1px 10px rgba(0, 0, 0, 0.8)";
            }
            div.innerHTML = "<ul>" + list + "</ul>";
            div.style.visibility = "visible";
        } else {
            showToolTip('Not found! Please, try again :)');
            console.log("WARNING: no results found in the database");
            hideLiveSearchResults();
        }
    }, 100);
}

// This methods is called in the 'onLoad' event handler of the contact.html page
function loadContactDetails() {
    var person = JSON.parse(localStorage.getItem('_person')); // for more information about localstorage: http://stackoverflow.com/questions/17309199/how-to-send-variables-from-one-file-to-another-in-javascript?answertab=votes#tab-top
    // or here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
    localStorage.removeItem('_person');
    var rows = " ";
    var officehours = " - ";
    var office = "";
    // Based on the office hours retrieved from the database, we will format it as a table:
    if (person.officehours != " ") {for (k = 0; k < person.officehours.length; k++) {
        rows += "<tr><td>"+ person.officehours[k].start +"</td><td>"+ person.officehours[k].end +" </td></tr>";
    } officehours = "<table>"+rows+"</table>"}
    // Now we will parse the office text searching for any number. If a number is found, this will be highlighted as a link:
    if (person.office != " ") {
        office = person.office.replace(/[0-9]+/g, function myFunction(x){return "<a href='#' onclick='linkSearch(this.innerHTML)'+>"+x+"</a>";}); // In this case 'x' is the item/result obtained from the match of the regular expression. You coud have also used "person.office.match(/[0-9]+/g);"
        // console.log(office);
        // More info at: http://www.w3schools.com/jsref/jsref_replace.asp
    } else {
        office = "-";
    }
    document.getElementById("p_header").innerHTML = person.name;
    document.getElementById("div_body").innerHTML =
    "<p>POSITION: </p><p>" + ((person.position != " ") ? person.position : "-") + "</p>" +
    "<p>FACULTY: </p><p>" + ((person.faculty != " ") ? person.faculty : "-") + "</p>"+
    "<p>OFFICE: </p><p>" + office + "</p>"+
    "<p>OFFICE HOURS: </p><p>" + officehours +"</p>" +
    "<p>EMAIL: </p><p>" + ((person.email != " ") ? person.email : "-") + "</p>"+
    "<p>PHONE: </p><p>" + ((person.phone != " ") ? person.phone : "-") + "</p>"+
    "<p>EXTENSION: </p><p>" + ((person.extension != " ") ? person.extension : "-") + "</p>"+
    "<p>FAX: </p><p>" + ((person.fax != " ") ? person.fax : "-") + "</p>"+
    "<p>PERSONAL WEBSITE: </p><p>" + ((person.website != " ") ? person.website : "-") + "</p>"+
    "<p>LINKEDIN: </p><p>" + ((person.linkedin != " ") ? person.linkedin : "-") + "</p>"+
    "<p>WORKING AT DeustoTech?: </p><p>" + ((person.dtech) ? "Yes" : "No") + "</p>"+
    "<p>NOTES: </p><p>" + ((person.notes != " ") ? person.notes : "-") + "</p>";
}

// This function is triggered when any link of the office numbers has been pressed. It puts the pressed room/place within the search bar
// and searches for it.
function linkSearch(x) {
    document.getElementById("searchbar").value = x;
    livesearch(x);
}

// This methods is called in the 'onLoad' event handler of the map.html page
function loadMap() {
    fetchDB();
    var room = JSON.parse(localStorage.getItem('_room')); // for more information about localstorage: http://stackoverflow.com/questions/17309199/how-to-send-variables-from-one-file-to-another-in-javascript?answertab=votes#tab-top
    // or here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
    localStorage.removeItem('_room');
    console.log("YOU ARE LOOKING FOR -"+ room[0].label + "- ROOM"); // eliminar esta traza
    setTimeout(function() {
        retrieveMap(room[1]); // Here we are retrieving the map corresponding to the floor given by the room[] array.
                             // If I take this call out of setTimeout function, JavaScripts yields errors.
        _sameFloor = true; // A boolean indicating wether the user is at the same floor as the one he/she is searching for.
                            // This works in conjuction with the "_allowYOUlabel" boolean to make the label YOU (source point, user's location) visible.
    },0)
    _floor = room[1]; // we assign the floor number to this global variable in order to decide what map to show later on.
    locateUser(); // This call executes all the algorithms to locate the person on the map (trilateration, drawing points and labels etc.)

    // We draw the orange SVG point on the map and the corresponding label too:
    var svg_circle = document.getElementById("svg_circle_destinationpoint");
    var label_dest = document.getElementById("p_dest_label");
    svg_circle.style.visibility="visible";
    svg_circle.style.left = parseInt(room[0].x) - 35 +"px"; // '35' is the radius of the circle's image declared at map.html. It is necessary to make the circle centered.
    svg_circle.style.top = parseInt(room[0].y) - 35 +"px"; // '35' is the radius of the circle's image declared at map.html. It is necessary to make the circle centered.
    // svg_circle.setAttribute("cx", room[0].x); // esto habia antes de quitar el SVG circle
    // svg_circle.setAttribute("cy", room[0].y); // esto habia antes de quitar el SVG circle
    label_dest.style.left= parseInt(room[0].x) + 40 +"px";
    label_dest.style.top= parseInt(room[0].y) + 40 +"px";
    label_dest.innerHTML=room[0].label;
    label_dest.style.visibility="visible";
    _destX = room[0].x; // Coordinate X of destination office/room
    _destY = room[0].y; // Coordinate Y of destination office/room

    /* IScroll 5 */
    document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false); // This is needed apparently for IScroll5
    // If you change the elements or the structure of your DOM you should call the refresh method: myScroll.refresh();
    // There are multiple events you can handle:
    // zoomEnd
    // zoomStart
    // scrollStart ...
    // like this: myScroll.on('scrollEnd', doSomething);
    // more info at: https://github.com/cubiq/iscroll
    var myScroll = new IScroll('#map_wrapper', {
        zoom: true, // It allows zooming
        scrollX: true, // It allows to scroll in the X axis
        scrollY: true, // It allows to scroll in the Y axis
        mouseWheel: true, // It listens to mouse wheel event
        zoomMin:0.5, // Default: 1
        zoomMax:1.2,
        freeScroll:true, // It allows to perform a free scroll within the wrapper. Not only strict X and Y scrolling.
        deceleration: 0.0001,
        wheelAction: 'zoom' // It regulates the wheel behaviour (zoom level vs scrolling position)
    });

    // We pan over the floor image to show the corresponding spot to the user:
    var map = document.getElementById("map");
    map.onload = function () {
        myScroll.scrollBy(-_destX, -_destY, 0, IScroll.utils.ease.elastic);
        myScroll.zoom(0.7, (map.clientWidth)/2, (map.clientHeight)/2, 1000);
    }

    // The following two functions, grow and shrink, are used to animate both red points locating the destination room and source point.
    // jQuery is used. More info about modifying DOM elements' attributes with jQuery at: http://stackoverflow.com/questions/6670718/jquery-animation-of-specific-attributes
    // and here too: http://api.jquery.com/animate/#animate-properties-options
   //  function grow() {
   //     $({r:$('#svg_circle_destinationpoint, #svg_circle_sourcepoint').attr('r')})
   //      .animate(
   //      {r: 35},
   //      {duration:1000,step:function(now){
   //        $('#svg_circle_destinationpoint, #svg_circle_sourcepoint').attr('r', now);
   //     }, complete:function(){shrink();}});
   // }
   //
   // function shrink() {
   //    $({r:$('#svg_circle_destinationpoint, #svg_circle_sourcepoint').attr('r')})
   //    .animate(
   //    {r: 18},
   //    {duration:1000,step:function(now){
   //      $('#svg_circle_destinationpoint, #svg_circle_sourcepoint').attr('r', now);
   //   }, complete:function(){grow();}});
   // }
   // grow();

}

// Shows/loads the image within the DOM element.
// "_sameFloor" boolean indicates whether to load the map/image just as a unique floor or as a second floor. This might occur if the user and the room are in different floors.
function showMap() {
    if (_sameFloor) {
        // We show the image as a unique map. This could mean that the user and the room are at the same floor.
        var map = document.getElementById("map");
        map.src = _reva;
    } else {
        // We show the image as a second map/floor. This means clearly, that the user and the room are not at the same floor.
        var map_sourcePoint = document.getElementById("map_sourcePoint");
        map_sourcePoint.src = _reva;
    }
}

// A function to swap between two maps
function switchMaps() {
    var map1 = document.getElementById("map");
    var map2 = document.getElementById("map_sourcePoint");
    var source_point = document.getElementById("svg_circle_sourcepoint");
    var dest_point = document.getElementById("svg_circle_destinationpoint");
    var you = document.getElementById("p_you");
    var dest_label = document.getElementById("p_dest_label");
    // var upstairs_downstairs = document.getElementById("p_upstairs_downstairs");
    if (map2.style.display != "inline") {
        map1.style.display = "none";
        map2.style.display = "inline";
        _allowYOUlabel ? you.style.visibility = "visible" : null; // This if is necessary to hide the YOU label in the corresponding scenario. Otherwise, it would appear without any meaning.
        dest_label.style.visibility = "hidden";
        // upstairs_downstairs.style.visibility = "visible";
        _allowYOUlabel ? source_point.style.visibility = "visible" : null; // This if is necessary to hide the YOU label in the corresponding scenario. Otherwise, it would appear without any meaning.
        dest_point.style.visibility = "hidden";
    } else {
        map2.style.display = "none";
        map1.style.display = "inline";
        you.style.visibility = "hidden";
        dest_label.style.visibility = "visible";
        source_point.style.visibility = "hidden";
        dest_point.style.visibility = "visible";
    }
}

// This functions checks two booleans. Both booleans are set during application runtime.
// All depends on whether there exists a communication with the beacons and if the user is at the same floor as the one he/she is searching for.
function showYOUlabel() {
    var map2 = document.getElementById("map_sourcePoint");
    var svg_circle_source = document.getElementById("svg_circle_sourcepoint"); // This is the SVG red point corresponding to YOU
    var label_you = document.getElementById("p_you"); // This is the red label corresponding to YOU
    console.log("sameFLorr = " + _sameFloor + " | allowYOUlabel = " + _allowYOUlabel);
    if ((_sameFloor == true && _allowYOUlabel == true) || (map2.style.display == "inline" && _allowYOUlabel)) {
        // We show the corresponding label and the svg point:
        // Note that the label and the SVG point corresponding to the room number is managed in "loadMap()" function.
        // Note that when two maps are loaded and shown, the label and SVG point is handled in "evothings.eddystone.js" script.
        svg_circle_source.style.visibility="visible";
        label_you.style.visibility="visible";
    } else {
        // We hide the label and the SVG point because in this scenario, the user and the floor he/she is searching are not the same:
        // Note that the label and the SVG point corresponding to the room number is managed in "loadMap()" function
        svg_circle_source.style.visibility="hidden";
        label_you.style.visibility="hidden";
    }
}
// This functions removes the possibility of switching between maps because it is supposed that the user and the room he/she is searching for are in the same floor.
// So, now, we go back to the normal scenario.
function removeDuplicatedMaps() {
    var map1 = document.getElementById("map");
    var map2 = document.getElementById("map_sourcePoint");
    var source_point = document.getElementById("svg_circle_sourcepoint");
    var dest_point = document.getElementById("svg_circle_destinationpoint");
    var you = document.getElementById("p_you");
    var dest_label = document.getElementById("p_dest_label");
    $("footer > img:first-child").fadeOut(2500);
    map1.style.display = "inline";
    map2.style.display = "none";
    you.style.visibility = "visible";
    dest_label.style.visibility = "visible";
    source_point.style.visibility = "visible";
    dest_point.style.visibility = "visible";
}

// This function shows a tooltip with the message given in the parameter when the user presses and maitains the finger over the object.
// When the user maintains the pressure over that object this tooltip will appear explaining the meaning of that button, object or whatever.
function showOnPressedToolTip(string){
    tooltipTimer = setTimeout(function () {
        window.plugins.toast.show(string, 'long', 'bottom', null, function(e){console.log("error showing toast:");console.log(e);});
    }, 800);
}

// This function shows a tooltip with the message given in the parameter.
// For the moment, the duration and position of the Toast message is not editable.
function showToolTip(string) {
    window.plugins.toast.show(string, 'long', 'bottom', null, function(e){console.log("error showing toast:");console.log(e);});
}

// Aborts the timer, and therefore, the toast message in this case
function abortTimer(){
    clearTimeout(tooltipTimer);
}
