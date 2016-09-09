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
// We use data-id becasue SPA (single page application) is a nightmare regarding selecting the IDs of the DOM -->
function hideLiveSearchResults() {
    // var div = document.getElementById("div_liveSearchResults");
    // div.innerHTML = "";
    // div.style.visibility = "hidden";
    var div = $("[data-id='liveSearchResults']");
    div.html("");
    div.css("visibility", "hidden");
}

// This function cleans the GUI of the index page.
function cleanGUI() {
    var div = document.getElementById("searchbar");
    div.value = "";
    hideLiveSearchResults();
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
    if (document.getElementById("searchbar").value == "") {return;} // When the erase/clear button is clicked in the search bar, the search is trigerred unintentionally, so this 'if' prevents the liveresults div from showing again.
    setTimeout(function() {
        if (_searched_rooms.length != 0) {
            var list = "";
            for (j = 0; j < _searched_rooms.length; j++) {
                list += "<li><a onclick='goMap("+j+")' data-transition='slide' href='#spa_map'><img src='img/location_ico_icon.png' alt='rooomicon' class='ui-li-icon ui-corner-none'>" + (_searched_rooms[j])[0].label + "</a></li>"
            }
            // var div = document.getElementById("div_liveSearchResults");
            var div = $("[data-id='liveSearchResults']");
            if (_searched_rooms.length > 6) {
                // div.style.boxShadow="0px 1px 10px rgba(0, 0, 0, 0.8), 0px -20px 20px -10px rgba(0, 0, 0, 0.8) inset";
                div.css("box-shadow", "0px 1px 10px rgba(0, 0, 0, 0.8), 0px -20px 20px -10px rgba(0, 0, 0, 0.8) inset");
            } else {
                // div.style.boxShadow="0px 1px 10px rgba(0, 0, 0, 0.8)";
                div.css("box-shadow", "0px 1px 10px rgba(0, 0, 0, 0.8)");
            }
            // div.innerHTML = "<ul data-role='listview'>" + list + "</ul>";
            // div.style.visibility = "visible";
            div.html("<ul data-role='listview'>" + list + "</ul>")
            div.css("visibility", "visible");
        } else {
            showToolTip('Not found! Please, try again :)');
            console.log("WARNING: no results found in the database");
            hideLiveSearchResults();
        }
    }, 100);
}

// Shows the list of rooms and staff found in the database according to the input text. It's displayed in the live-search-result element from DOM.
function showBothStaffNRooms() {
    if (document.getElementById("searchbar").value == "") {return;} // When the erase/clear button is clicked in the search bar, the search is trigerred unintentionally, so this 'if' prevents the liveresults div from showing again.
    setTimeout(function() {
        console.log("length PEOPLE: " +_searched_people.length); // eliminar esta traza
        console.log("length ROOMS: " +_searched_rooms.length); // eliminar esta traza
        var list = "";
        if (_searched_people.length != 0) {
            for (j = 0; j < _searched_people.length; j++) {
                list += "<li><a onclick='goContact("+j+")' data-transition='slide' href='#spa_contact'><img src='img/profilepic_icon.png' alt='stafficon' class='ui-li-icon ui-corner-none'>" + _searched_people[j].name + "</a></li>"
                // ontouchstart='return true; attribute needed??'
            }
        }
        if (_searched_rooms.length != 0) {
            for (j = 0; j < _searched_rooms.length; j++) {
                list += "<li><a onclick='goMap("+j+")' data-transition='slide' href='#spa_map'><img src='img/location_ico_icon.png' alt='rooomicon' class='ui-li-icon ui-corner-none'>" + (_searched_rooms[j])[0].label + "</a></li>"
                // ontouchstart='return true; attribute needed??'
            }
        }
        if (list != "") {
            // var div = document.getElementById("div_liveSearchResults");
            var div = $("[data-id='liveSearchResults']");
            if (_searched_people.length + _searched_rooms.length > 6) {
                // div.style.boxShadow="0px 1px 10px rgba(0, 0, 0, 0.8), 0px -20px 20px -10px rgba(0, 0, 0, 0.8) inset";
                div.css("box-shadow", "0px 1px 10px rgba(0, 0, 0, 0.8), 0px -20px 20px -10px rgba(0, 0, 0, 0.8) inset");
            } else {
                // div.style.boxShadow="0px 1px 10px rgba(0, 0, 0, 0.8)";
                div.css("box-shadow", "0px 1px 10px rgba(0, 0, 0, 0.8)");
            }
            // div.innerHTML = "<ul data-role='listview'>" + list + "</ul>";
            // div.style.visibility = "visible";
            div.html("<ul data-role='listview'>" + list + "</ul>")
            div.css("visibility", "visible");
        } else {
            showToolTip('Not found! Please, try again :)');
            console.log("WARNING: no results found in the database");
            hideLiveSearchResults();
        }
    }, 100);
}

// This methods is called in the 'onLoad' event handler of the contact.html page
function loadContactDetails() {
    // var person = JSON.parse(localStorage.getItem('_person')); // for more information about localstorage: http://stackoverflow.com/questions/17309199/how-to-send-variables-from-one-file-to-another-in-javascript?answertab=votes#tab-top
    // // or here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
    // localStorage.removeItem('_person');
    var person = _searched_people[_index];
    var rows = " ";
    var officehours = " - ";
    var office = "";
    // Based on the office hours retrieved from the database, we will format it as a table:
    if (person.officehours != " ") {for (k = 0; k < person.officehours.length; k++) {
        rows += "<tr><td>"+ person.officehours[k].start +"</td><td>"+ person.officehours[k].end +" </td></tr>";
    } officehours = "<table>"+rows+"</table>"}
    // Now we will parse the office text searching for any number. If a number is found, this will be highlighted as a link:
    if (person.office != " ") {
        office = person.office.replace(/[0-9]+/g, function myFunction(x){return "<a href='#spa_contact' data-transition='slide' onclick='linkSearch(this.innerHTML)'+>"+x+"</a>";}); // In this case 'x' is the item/result obtained from the match of the regular expression. You coud have also used "person.office.match(/[0-9]+/g);"
        // console.log(office);
        // More info at: http://www.w3schools.com/jsref/jsref_replace.asp
    } else {
        office = "-";
    }
    document.getElementById("p_profile_header").innerHTML = person.name;
    document.getElementById("div_profile_body").innerHTML =
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

    // This code snippet initializes the swiping effect panel in the CONTACT page
    $(document).on("swipeleft", "#spa_contact", function(e) {
        // We check if there is no open panel on the page because otherwise
        // a swipe to close the left panel would also open the right panel (and v.v.).
        // We do this by checking the data that the framework stores on the page element (panel: open).
        if ($(".ui-page-active").jqmData("panel") !== "open") {
            if (e.type === "swipeleft") {
                $("#sidepanel_contact").panel("open");
            }
        }
    });
}

// This function is triggered when any link of the office numbers has been pressed. It puts the pressed room/place within the search bar
// and searches for it.
function linkSearch(x) {
    document.getElementById("searchbar").value = x;
    livesearch(x);
}

// This methods is called in the 'onLoad' event handler of the map.html page
function loadMap() {
    fetchDB(); // ESTA LLAMDA HABRIA QUE QUITARLA LO MAS SEGURO
    // var room = JSON.parse(localStorage.getItem('_room')); // for more information about localstorage: http://stackoverflow.com/questions/17309199/how-to-send-variables-from-one-file-to-another-in-javascript?answertab=votes#tab-top
    // // or here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
    // localStorage.removeItem('_room');
    console.log("YOU ARE LOOKING FOR -"+ _searched_rooms[_index][0].label + "- ROOM"); // eliminar esta traza
    setTimeout(function() {
        retrieveMap(_searched_rooms[_index][1]); // Here we are retrieving the map corresponding to the floor given by the room[] array.
                             // If I take this call out of setTimeout function, JavaScripts yields errors.
        _sameFloor = true; // A boolean indicating wether the user is at the same floor as the one he/she is searching for.
                            // This works in conjuction with the "_allowYOUlabel" boolean to make the label YOU (source point, user's location) visible.
    },0)
    _floor = _searched_rooms[_index][1]; // we assign the floor number to this global variable in order to decide what map to show later on.
    locateUser(); // This call executes all the algorithms to locate the person on the map (trilateration, drawing points and labels etc.)

    // We draw the orange SVG point on the map and the corresponding label too:
    var svg_circle = document.getElementById("svg_circle_destinationpoint");
    var label_dest = document.getElementById("p_dest_label");
    svg_circle.style.visibility="visible";
    svg_circle.style.left = parseInt(_searched_rooms[_index][0].x) - 35 +"px"; // '35' is the radius of the circle's image declared at map.html. It is necessary to make the circle centered.
    svg_circle.style.top = parseInt(_searched_rooms[_index][0].y) - 35 +"px"; // '35' is the radius of the circle's image declared at map.html. It is necessary to make the circle centered.
    // svg_circle.setAttribute("cx", _searched_rooms[_index][0].x); // esto habia antes de quitar el SVG circle
    // svg_circle.setAttribute("cy", _searched_rooms[_index][0].y); // esto habia antes de quitar el SVG circle
    label_dest.style.left= parseInt(_searched_rooms[_index][0].x) + 40 +"px";
    label_dest.style.top= parseInt(_searched_rooms[_index][0].y) + 40 +"px";
    label_dest.innerHTML=_searched_rooms[_index][0].label;
    label_dest.style.visibility="visible";
    _destX = _searched_rooms[_index][0].x; // Coordinate X of destination office/room
    _destY = _searched_rooms[_index][0].y; // Coordinate Y of destination office/room

    /* IScroll 5 */
    // document.getElementById("spa_map").addEventListener('touchmove', function (e) { e.preventDefault(); }, false); // This is needed apparently for IScroll5
    // If you change the elements or the structure of your DOM you should call the refresh method: myScroll.refresh();
    // There are multiple events you can handle:
    // zoomEnd
    // zoomStart
    // scrollStart ...
    // like this: myScroll.on('scrollEnd', doSomething);
    // more info at: https://github.com/cubiq/iscroll
    // var myScroll = new IScroll('#map_wrapper', {
    //     zoom: true, // It allows zooming
    //     scrollX: true, // It allows to scroll in the X axis
    //     scrollY: true, // It allows to scroll in the Y axis
    //     mouseWheel: true, // It listens to mouse wheel event
    //     zoomMin:0.5, // Default: 1
    //     zoomMax:1.2,
    //     freeScroll:true, // It allows to perform a free scroll within the wrapper. Not only strict X and Y scrolling.
    //     deceleration: 0.0001,
    //     wheelAction: 'zoom' // It regulates the wheel behaviour (zoom level vs scrolling position)
    // });
    /* jQuery panzoom by timmywil */
    $("#map_wrapper").panzoom({
        // Should always be non-empty
        // Used to bind jQuery events without collisions
        // A guid is not added here as different instantiations/versions of Panzoom
        // on the same element is not supported.
        eventNamespace: ".panzoom",
        // Whether or not to transition the scale
        transition: true,
        // Default cursor style for the element
        cursor: "move",
        // There may be some use cases for zooming without panning or vice versa
        // NOTE: disablePan also disables focal point zooming
        disablePan: false,
        disableZoom: false,
        // Pan only on the X or Y axes
        disableXAxis: false,
        disableYAxis: false,
        // Set whether you'd like to pan on left (1), middle (2), or right click (3)
        which: 1,
        // The increment at which to zoom
        // adds/subtracts to the scale each time zoomIn/Out is called
        increment: 0.3,
        // Turns on exponential zooming
        // If false, zooming will be incremented linearly
        exponential: true,
        // Pan only when the scale is greater than minScale
        panOnlyWhenZoomed: false,
        // min and max zoom scales
        minScale: 0.4,
        maxScale: 1.2,
        // The default step for the range input
        // Precendence: default < HTML attribute < option setting
        rangeStep: 0.05,
        // Animation duration (ms)
        duration: 400,
        // CSS easing used for scale transition
        easing: "ease-in-out",
        // Indicate that the element should be contained within its parent when panning
        // Note: this does not affect zooming outside of the parent
        // Set this value to 'invert' to only allow panning outside of the parent element (the opposite of the normal use of contain)
        // 'invert' is useful for a large Panzoom element where you don't want to show anything behind it
        contain: true
        // Transform value to which to always reset (string)
        // Defaults to the original transform on the element when Panzoom is initialized
        // startTransform: undefined,
        // This optional jQuery collection can be set to specify all of the elements
        // on which the transform should always be set.
        // It should have at least one element.
        // This is mainly used for delegating the pan and zoom transform settings
        // to another element or multiple elements.
        // The default is the Panzoom element wrapped in jQuery
        // See the [demo](http://timmywil.github.io/jquery.panzoom/demo/#set) for an example.
        // Note: only one Panzoom element will still handle events for a Panzoom instance.
        // Use multiple Panzoom instances for that use case.
        // $set: $elem,
        // Zoom buttons/links collection (you can also bind these yourself - e.g. `$button.on("click", function( e ) { e.preventDefault(); $elem.panzoom("zoom"); });` )
        // $zoomIn: $(),
        // $zoomOut: $(),
        // Range input on which to bind zooming functionality
        // $zoomRange: $(),
        // Reset buttons/links collection on which to bind the reset method
        // $reset: $(),
        // For convenience, these options will be bound to Panzoom events
        // These can all be bound normally on the Panzoom element
        // e.g. `$elem.on("panzoomend", function( e, panzoom ) { console.log( panzoom.getMatrix() ); });`
        // onStart: undefined,
        // onChange: undefined,
        // onZoom: undefined,
        // onPan: undefined,
        // onEnd: undefined,
        // onReset: undefined
    });

    // We pan over the floor image to show the corresponding spot to the user:
    var map = document.getElementById("map");
    map.onload = function () {
        $("#map_wrapper").panzoom("resetPan", false);
        $("#map_wrapper").panzoom("resetZoom", false);
        $("#map_wrapper").panzoom("pan", -_destX, -_destY);
        $("#map_wrapper").panzoom("zoom", 0.7, { animate: true });
        // myScroll.scrollBy(-_destX, -_destY, 0, IScroll.utils.ease.elastic);
        // myScroll.zoom(0.7, (map.clientWidth)/2, (map.clientHeight)/2, 1000);
    }

    // This code snippet initializes the swiping effect panel in the MAP page
    $(document).on("swipeleft", "#spa_map", function(e) {
        // We check if there is no open panel on the page because otherwise
        // a swipe to close the left panel would also open the right panel (and v.v.).
        // We do this by checking the data that the framework stores on the page element (panel: open).
        if ($(".ui-page-active").jqmData("panel") !== "open") {
            if (e.type === "swipeleft") {
                $("#sidepanel_map").panel("open");
            }
        }
    });

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

// This function loads the map html page within the SPA (Single Page Application) context.
function goMap(index) {
    // I used to do this in a different way, using localstorage: http://stackoverflow.com/questions/17309199/how-to-send-variables-from-one-file-to-another-in-javascript?answertab=votes#tab-top
    // more info here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
    _index = index; // Now we assign the index to a global variable so as to know which variable to use in "searched room" and "searched people"
    hideLiveSearchResults();
    loadMap();
}

// This function loads the contact html page within the SPA (Single Page Application) context.
function goContact(index) {
    // I used to do this in a different way, using localstorage: http://stackoverflow.com/questions/17309199/how-to-send-variables-from-one-file-to-another-in-javascript?answertab=votes#tab-top
    // more info here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
    _index = index; // Now we assign the index to a global variable so as to know which variable to use in "searched room" and "searched people"
    hideLiveSearchResults();
    clearInterval(_trilaterationTimer);
    loadContactDetails();
    evothings.eddystone.stopScan(); // we stop the scan because is not needed anymore
}

// This function tries to hide the footer when the soft keyboard is shown in the screen and tries to display it when the soft keyboard disappears. Currently it does not work very well.
// _input is a boolean representing whether an text input has gained focus or not.
// _viewportHeight is the Height of the Viewport of the application at some point in time.
// _softKeyboard is a boolean representing whether the soft keyboard is shown or not.
function softKeyboard(height) {
    var piezazo = document.getElementById("footer"); // 'piezazo' is the footer
    if (!_input || (_input && height > _viewportHeight && _softKeyboard)) {piezazo.style.display = "initial"; _softKeyboard = false} else if (_input && !_softKeyboard ) {piezazo.style.display = "none"; _softKeyboard = true;}
    _viewportHeight = height;
}

// PLUGIN CORDOVA-PLUGIN-GOOGLE+ (OAuth):
// Ojo al dato, con este plugin lo que hace es autenticarte con alguna cuenta que tengas vinculada en el propio dispositivo
// Es decir, no te deja introducir email y contraseña como lo harias mediante una pagina web. Has de acceder mediante una cuenta
// vinculada/registrada en el dispositivo. Es un approach mas nativo que otras opciones.
// Siguiendo los pasos al pie de la letra funciona correctamente todo. Cuidado en el campo "webClientId" de esta función dado que ha de ser el WEBclientID, no el del Android.
// Puede que tengas que comentar el metatag de index.html de "google-signin-client_id".
// OJO! OJo con el config.xml, has de poner el mismo id de la aplicacion en Google Developer Console.
// Github page: https://github.com/EddyVerbruggen/cordova-plugin-googleplus
// Utilizando keytool: https://developers.google.com/drive/android/auth
// Ubicacion de tu debug.keystore: https://developer.android.com/studio/publish/app-signing.html
// Para mas informacion sobre todo: https://developers.google.com/identity/sign-in/web/sign-in
// Google Developers products: https://developers.google.com/products/
// Apps connected to your device/account: https://security.google.com/settings/security/permissions?pli=1
function signInOAuth() {
    if (!_signedIn) {
        try {
            window.plugins.googleplus.login(
                {
                    'webClientId': '473073684258-jss0qgver3lio3cmjka9g71ratesqckr.apps.googleusercontent.com' // optional clientId of your Web application from Credentials settings of your project - On Android, this MUST be included to get an idToken. On iOS, it is not required.
                },
                function (obj) {
                    // On success:
                    console.log("Sign in successful!");
                    console.log(JSON.stringify(obj));
                    // SHOW SIGN OUT BUTTON
                    // SET ANY VARIABLE BY MYSELF
                    signInOperations();
                },
                function (msg) {
                    // On error:
                    console.log("WARNING! (signInOAuth). Probably the user has cancelled the operation: " + msg);
                }
            );
        } catch (e) {
            // On error:
            console.log("ERROR! (signInOAuth): " + e);
        }
    } else {
        // CAMBIAR DE PAGE E IR DIRECTOS A LA EDICION
    }
}

function disconnectOAuth() {
    try {
        window.plugins.googleplus.disconnect(
            function (msg) {
                // On success:
                console.log("Disconnection successful!");
                console.log(msg);
                showToolTip("Signing out was successful! Come back soon ;-)");
                // REMOVE SING OUT BUTTON!
                // CLEAR ANY VARIABLE SET BY MYSELF
                _signedIn = false;
                $(".btn_signout").fadeToggle("slow");
                $("#p_oauth_email").fadeToggle("slow");
            }
        );
    } catch (e) {
        // On error:
        console.log("ERROR! (disconnectOAuth): " + e);
    }
}

function silentLoginOAuth() {
    try {
        window.plugins.googleplus.trySilentLogin(
            {
                'webClientId': '473073684258-jss0qgver3lio3cmjka9g71ratesqckr.apps.googleusercontent.com' // optional clientId of your Web application from Credentials settings of your project - On Android, this MUST be included to get an idToken. On iOS, it is not required.
            },
            function (obj) {
                // On success:
                console.log("Silent login successful!");
                console.log(JSON.stringify(obj));
                // SHOW SIGN OUT BUTTON
                // SET ANY VARIABLE BY MYSELF
                signInOperations();
            },
            function (msg) {
                // On warning or error:
                console.log("WARNING! (silentLoginOAuth). Probably the user was not logged in: " + msg);
            }
        );
    } catch (e) {
        // On error:
        console.log("ERROR! (silentLoginOAuth)" + e);
    }
}

function signInOperations() {
    $(".btn_signout").fadeToggle("slow");
    $("#p_oauth_email").fadeToggle("slow");
    _signedIn = true;
}
