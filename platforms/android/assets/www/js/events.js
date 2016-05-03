var searchtimer; // GLOBAL VARIABLE. A timer that executes a certain function when the user stops writing something in the search bar.
var inputValue; // Value/text introduced by the user

// This function tracks the user when he/she stops writing and makes a query with the text within the bar. It makes sure that white
// spaces don't count as a query. It's a live search meaning that every 1s it checks what is inside the search bar.
function livesearch(text) {
    // var re = /\s/g; // regular expression checking for one or more space characters in the whole string, "g" means global.
                        // We are not using it for the moment because "Fulanito menganito" would be detected as a string with a space,
                        // hence the serach would not be lunched. To test a text accordingly to the regular expressions just: re.test(text)
    text = text.trim().toLowerCase(); // Here we "validate"/filter the input. We avoid "all whitespaces" and empty strings among others.
    if (text.length != 0 && text != "" && !/\d/.test(text)) {
        console.log("ES UNA PERSONA!");
        inputValue = text;
        console.log(inputValue);
        if (searchtimer === undefined) {
            searchtimer = setTimeout(searchPeople, 500); // More info about timer at: http://www.w3schools.com/js/js_timing.asp
        } else {
            clearTimeout(searchtimer);
            searchtimer = setTimeout(searchPeople, 500); // More info about timer at: http://www.w3schools.com/js/js_timing.asp
        } // END inside if
    } else if (/\d/.test(text)){ // This is going to happen if the input has a digit among what has been written
        console.log("ES UN NUMERO!");
        inputValue = text;
        console.log(inputValue);
        if (searchtimer === undefined) {
            searchtimer = setTimeout(searchRoom, 500); // More info about timer at: http://www.w3schools.com/js/js_timing.asp
        } else {
            clearTimeout(searchtimer);
            searchtimer = setTimeout(searchRoom, 500); // More info about timer at: http://www.w3schools.com/js/js_timing.asp
        } // END inside if
    } else {
        clearTimeout(searchtimer);
        hideLiveSearchResults();
    }// END outside if
}

function hideLiveSearchResults() {
    var div = document.getElementById("div_liveSearchResults");
    div.innerHTML = " ";
    div.style.visibility = "hidden";
}
// Searches for the person/people in the database
function searchPeople() {
    retrievePerson(inputValue);
}
// Searches for the room in the database
function searchRoom() {
    retrieveRoom(inputValue);
}
// Show the list of people (staff) found in the database according to the input text
function showStaffList() {
    setTimeout(function() {
        if (_searched_people.length != 0) {
            var list = "";
            for (j = 0; j < _searched_people.length; j++) {
                list += "<li onclick='goContact("+j+")' ontouchstart='highlight(this)' ontouchend='highlightdefault(this)'>" + _searched_people[j].name + "</li>"
            }
            var div = document.getElementById("div_liveSearchResults");
            div.innerHTML = "<ul>" + list + "</ul>";
            div.style.visibility = "visible";
        } else {
            console.log("Per que coño pasa?!");
            var div = document.getElementById("div_liveSearchResults");
            div.innerHTML = " ";
            div.style.visibility = "hidden";
        }
    }, 100);
}

function showRoomsList() {
    setTimeout(function() {
        if (_searched_rooms.length != 0) {
            var list = "";
            for (j = 0; j < _searched_rooms.length; j++) {
                list += "<li onclick='goMap("+j+")' ontouchstart='highlight(this)' ontouchend='highlightdefault(this)'>" + (_searched_rooms[j])[0].label + "</li>"
            }
            var div = document.getElementById("div_liveSearchResults");
            div.innerHTML = "<ul>" + list + "</ul>";
            div.style.visibility = "visible";
        } else {
            console.log("Per que coño pasa?!");
            var div = document.getElementById("div_liveSearchResults");
            div.innerHTML = " ";
            div.style.visibility = "hidden";
        }
    }, 100);
}

function highlight(li) {
    li.style.backgroundColor = "#0053ce";
    li.style.color = "#FFF";
}

function highlightdefault(li) {
    li.style.backgroundColor = "transparent";
    li.style.color = "initial";
}

function loadContactDetails() {
    var person = JSON.parse(localStorage.getItem('_person')); // for more information about localstorage: http://stackoverflow.com/questions/17309199/how-to-send-variables-from-one-file-to-another-in-javascript?answertab=votes#tab-top
                                                            // or here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
    localStorage.removeItem('_person');
    var rows = " ";
    var officehours = " - ";
    if (person.officehours != " ") {for (k = 0; k < person.officehours.length; k++) {
        rows += "<tr><td>"+ person.officehours[k].start +"</td><td>"+ person.officehours[k].end +" </td></tr>";
    } officehours = "<table>"+rows+"</table>"}
    document.getElementById("p_header").innerHTML = person.name;
    document.getElementById("div_body").innerHTML =
    "<p>POSITION: </p><p>" + ((person.position != " ") ? person.position : "-") + "</p>" +
    "<p>FACULTY: </p><p>" + ((person.faculty != " ") ? person.faculty : "-") + "</p>"+
    "<p>OFFICE: </p><p>" + ((person.office != " ") ? person.office : "-") + "</p>"+
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

function loadMap() {
    var room = JSON.parse(localStorage.getItem('_room')); // for more information about localstorage: http://stackoverflow.com/questions/17309199/how-to-send-variables-from-one-file-to-another-in-javascript?answertab=votes#tab-top
                                                            // or here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
    localStorage.removeItem('_room');
    var scrollableContent = document.getElementById("scrollable_content");
    var map = document.getElementById("map");

    setTimeout(function() {
        retrieveMap2(room[1]); // If I take this call out of setTimeout function, JavaScripts yields errors. The DOM element map is also passed as an argument
    },0)

    // map.addEventListener("load", function() {
    //     // nothing to declare here for the moment
    // }, false);

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
        zoom: true, // It allos zooming
        scrollX: true, // It allows to scroll in the X axis
        scrollY: true, // It allows to scroll in the Y axis
        mouseWheel: true, // It listens to mouse wheel event
        zoomMin:0.5, // Default: 1
        zoomMax:1.2,
        freeScroll:true, // It allows to perform a free scroll within the wrapper. Not only strict X and Y scrolling.
        deceleration: 0.0001,
        wheelAction: 'zoom' // It regulates the wheel behaviour (zoom level vs scrolling position)
    });

}
