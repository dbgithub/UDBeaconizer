// This method initializes the functionalities of some plugins and third-party scripts all in one function.
// It is not strictly required to initialize it at the beginning, but it saves time whenever the functionalities are needed during the life-cycle of the application.
  function pluginsInitialization() {
    // jQuery-flip
    $("#card").flip({
        trigger: 'manual',
        axis: 'y',
        reverse:true,
        front: $(".jqueryFlip-front"),
        back: $(".jqueryFlip-back")
    });

    // jQuery-flip
    $("#floor_label").flip({
        trigger: 'manual',
        axis: 'x',
        reverse:true,
        front: $(".jqueryFlip-front_floor"),
        back: $(".jqueryFlip-back_floor")
    });

    // Swiping effect panel in the MAP page
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

    // Swiping effect panel in the CONTACT page
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
        increment: 0.33,
        // When no scale is passed, this option tells
        // the `zoom` method to increment
        // the scale *linearly* based on the increment option.
        // This often ends up looking like very little happened at larger zoom levels.
        // The default is to multiply/divide the scale based on the increment.
        linearZoom: true,
        // Pan only when the scale is greater than minScale
        panOnlyWhenZoomed: false,
        // min and max zoom scales
        minScale: 0.2,
        maxScale: 0.7,
        // The default step for the range input
        // Precendence: default < HTML attribute < option setting
        rangeStep: 0.05,
        // Animation duration (ms)
        duration: 400,
        // CSS easing used for scale transition
        easing: "ease-in-out",
        // Indicate how the element should be contained within its parent when panning
        // Note: this does not affect zooming outside of the parent
        // Set this value to 'invert' to only allow panning when the bounds of the element are bigger than the parent. You'd be able to pan from outside the parent.
        // Set this value to 'automatic' to let the script decide when to apply "true" or "invert". It all depends on the size of the element and whether it exceeds the bounds of the parent.
        // Set this value to true to only allow panning when the element is contained within the parent. It will bounce against the borders when it approaches the borders.
        // You can set padding values to the inner element so that you can make a little more space between the element and the parent.
        contain: false
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

    // We assign an Event Listener to pan and zoom whenever the image is loaded in SPA map:
    var map = document.getElementById("map");
    map.addEventListener("load", panANDzoom);
    // We also want to assign an Event Listener in case an error occurs loading the image:
    map.addEventListener("error", () => {
        if (!_showingDialog) {
            _showingDialog = true;
            navigator.notification.confirm('An error occured loading the map... \nWould you like to try again? 😣', function(responseIndex) {_showingDialog = false; (responseIndex == 1)? goMap(_index): null;},'Opss...!',["Yes, please!","Nah, it doesn't matter!"]);
        }
    });
}

// This function tracks the user when he/she stops writing and makes a query with the text within the bar. It makes sure that white
// spaces don't count as a query. It's a live search meaning that every 1s it checks what is inside the search bar.
  function livesearch(inputvalue) {
    // var re = /\s/g; // this is a regular expression checking for one or more space characters in the whole string, "g" means global.
    // We are not using it for the moment because "Fulanito menganito" would be detected as a string with a space,
    // hence the search would not be lunched. To test a text accordingly to the regular expressions just: re.test(text)
    inputvalue = removeTildes(inputvalue.trim().toLowerCase()); // Here we "validate"/filter the input. We avoid "all whitespaces" and empty strings among others.
    // We check whether the input text introduced by the user contains numbers (rooms, offices...) or a simple name:
    if (inputvalue.length != 0 && inputvalue != "" && !/\d/.test(inputvalue)) {
        console.log(inputvalue);
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(function() {searchPeople(inputvalue)}, 50); // YOU CAN MODIFY the '50' value to make it more responsive. More info about timer at: http://www.w3schools.com/js/js_timing.asp
    } else if (/\d/.test(inputvalue)){ // This is going to happen if the input has a digit among what has been written
        console.log(inputvalue);
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(function() {searchRoom(inputvalue)}, 50); // YOU CAN MODIFY the '50' value to make it more responsive. More info about timer at: http://www.w3schools.com/js/js_timing.asp
    } else {
        // More info about Toast plugin at: https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin
        clearTimeout(_searchTimer);
        hideLiveSearchResults();
        showToolTip('Please, type anything in the search bar :)');
    }// END outside if

    // Inner function to remove the tildes from a phrase or text.
    function removeTildes(phrase) {
        var abcFrom = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñ"; // These are the characters we want to replace in the text passed as an argument
        var abcTo = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuuNn"; // These are the characters which we want to replace with in the text.
        var NumTildesEncontradas = phrase.match(/[ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñ]/g) || 0; // Finds the number of characters to replace. With the logical OR of '0' we are avoiding a null exception error and thus, skipping content that has no 'tildes'
        // Now we will iterate the same amount of time that characters are to be replaced.
        // We want to find the index of the characters without "tilde" and we will replace it with the one that does have.
        for (l = 0; l < NumTildesEncontradas.length; l++) {
    	    var indexWithoutTilde = abcFrom.indexOf(phrase.match(/[ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñ]+/g)[0])
            phrase = phrase.replace(NumTildesEncontradas[l], abcTo[indexWithoutTilde])
        }
        return phrase;
    }
}

// It hides the live-search-result DOM element and its content
// We collect several elements with a certain ID becasue SPA (single page application) is a nightmare regarding selecting the IDs of the DOM
  function hideLiveSearchResults() {
    var div = $("[id='div_liveSearchResults']"); // It obtains all elements with 'id' to whatever. It doesn't just capture the element in the current page, instead, it captures all divs from all pages.
    for (i = 0; i< div.length; i++) {
        $(div[i]).css("visibility", "hidden");
        $(div[i]).html("");
    }
    console.log("All 'LiveResults' cleaned!");
}

// This function cleans the GUI of the index page. This involves cleaning the text within ALL inputs of all SPA pages.
// As an aside note, it also removes the jQuery white crosses that are used to actually remove the content of the inputs too.
  function cleanGUI() {
    var input = $("[class=input_search_bar]");
    // We are also interested in removing the jQuery white cross that is used to erase the content of the input.
    // This white cross is drawn (implemented) as an anchor tag (<a>) by jQuery, so we need to access it and add a "hidden" class.
    var searchbarstyle = $(".div_searchbarStyle a");
    var searchbarstyle_v2 = $(".div_searchbarStyle_v2 a");
    for (i = 0; i< input.length; i++) {
        input[i].value = ""; // I was using: '$(input[i]).attr("value", "");', but it didn't work properly!
        $(searchbarstyle[i]).addClass("ui-input-clear-hidden");
    }
    $(searchbarstyle).addClass("ui-input-clear-hidden");
    hideLiveSearchResults();
    console.log("All 'InputSearch' cleaned!");
}

// Searches for the person/people in the database
// We also make a call to "retrieveRoom" because there are some rooms that doesn't contain numbers and therefore are treated as normal strings
  function searchPeople(inputvalue) {
    retrievePerson(inputvalue, function() {showBothStaffNRooms();});
    retrieveRoom(inputvalue, false, function() {showRoomsList();}); // false means that it doesn't show its results because "retrievePerson" is actually handleing it.
}

// Searches for the room in the database
  function searchRoom(inputvalue) {
    retrieveRoom(inputvalue, true, function() {showRoomsList();}); // true means that it DOES show its results because the search item contains a number
}

// Shows the list of rooms (labs, places) found in the database according to the input text. It's displayed in the live-search-result element from DOM.
  function showRoomsList() {
    if (_personRoomTouched) {return;} // This prevents the liveSearchResults div from appearing when a SPA page is changed and a search is still on the go.
    if ($(window.location.hash + " input.input_search_bar").val() == "") {return;} // When the erase/clear button is clicked in the search bar, the search is trigerred unintentionally, so this 'if' prevents the liveresults div from showing again.
    console.log("Items found (rooms): " +_searched_rooms.length);
    if (_searched_rooms.length != 0) {
        if (_searched_rooms.length == 1 && _linkSearch) {window.location='#spa_map';goMap(0); _linkSearch = false; return;} // If this statement returns true, it means that the search was originally performed by a link-pressed action (within the contact page for instance).
        var list = "";
        for (j = 0; j < _searched_rooms.length; j++) {
            list += "<li><a ontouchend=\"if(_preventClick){_preventClick=false;return true;}; if (window.location.hash == '#spa_edit_contact') {prompt_savecancel('DISCARD changes',0, function() {window.location='#spa_map'; _personRoomTouched = true; goMap("+j+");})} else {window.location='#spa_map'; _personRoomTouched = true; goMap("+j+");};\" ontouchmove='_preventClick=true;' data-transition='slide' data-prefetch='true'><img src='img/location_ico_icon.png' alt='rooomicon' class='ui-li-icon ui-corner-none'>" + (_searched_rooms[j])[0].label + "</a></li>"
        }
        var div = $(window.location.hash + " #div_liveSearchResults");
        if (_searched_rooms.length > 6) {
            div.css("box-shadow", "0px 1px 10px rgba(0, 0, 0, 0.8), 0px -20px 20px -10px rgba(0, 0, 0, 0.8) inset");
        } else {
            div.css("box-shadow", "0px 1px 10px rgba(0, 0, 0, 0.8)");
        }
        div.html("<ul data-role='listview'>" + list + "</ul>")
        div.css("visibility", "visible");
    } else {
        showToolTip('Not found! Please, try again :)');
        console.log("WARNING: no results found in the database");
        hideLiveSearchResults();
    }
}

// Shows the list of rooms and staff found in the database according to the input text. It's displayed in the live-search-result element from DOM.
  function showBothStaffNRooms() {
    if (_personRoomTouched) {return;} // This prevents the liveSearchResults div from appearing when a SPA page is changed and a search is still on the go.
    if ($(window.location.hash + " input.input_search_bar").val() == "") {return;} // When the erase/clear button is clicked in the search bar, the search is trigerred unintentionally, so this 'if' prevents the liveresults div from showing again.
    console.log("Items found (people): " +_searched_people.length);
    console.log("Items found (rooms): " +_searched_rooms.length);
    var list = "";
    if (_searched_people.length != 0) {
        for (j = 0; j < _searched_people.length; j++) {
            list += "<li><a ontouchend=\"if(_preventClick){_preventClick=false;return true;}; if (window.location.hash == '#spa_edit_contact') {prompt_savecancel('DISCARD changes',0, function() {window.location='#spa_contact'; _personRoomTouched = true; goContact("+j+");})} else {window.location='#spa_contact'; _personRoomTouched = true; goContact("+j+");};\" ontouchmove='_preventClick=true;' data-transition='slide' data-prefetch='true'><img src='img/profilepic_icon.png' alt='stafficon' class='ui-li-icon ui-corner-none'>" + _searched_people[j].name + "</a></li>"
        }
    }
    if (_searched_rooms.length != 0) {
        for (j = 0; j < _searched_rooms.length; j++) {
            list += "<li><a ontouchend=\"if(_preventClick){_preventClick=false;return true;}; if (window.location.hash == '#spa_edit_contact') {prompt_savecancel('DISCARD changes',0, function() {window.location='#spa_map'; _personRoomTouched = true; goMap("+j+");})} else {window.location='#spa_map'; _personRoomTouched = true; goMap("+j+");};\" ontouchmove='_preventClick=true;' data-transition='slide' data-prefetch='true'><img src='img/location_ico_icon.png' alt='rooomicon' class='ui-li-icon ui-corner-none'>" + (_searched_rooms[j])[0].label + "</a></li>"
        }
    }
    if (list != "") {
        var div = $(window.location.hash + " #div_liveSearchResults");
        if (_searched_people.length + _searched_rooms.length > 6) {
            div.css("box-shadow", "0px 1px 10px rgba(0, 0, 0, 0.8), 0px -20px 20px -10px rgba(0, 0, 0, 0.8) inset");
        } else {
            div.css("box-shadow", "0px 1px 10px rgba(0, 0, 0, 0.8)");
        }
        div.html("<ul data-role='listview'>" + list + "</ul>")
        div.css("visibility", "visible");
    } else {
        hideLiveSearchResults();
        showToolTip('Not found! Please, try again :)');
        console.log("WARNING: no results found in the database");
    }
}

// This is called when SPA Contact is loaded
  function loadContactDetails() {
    // I used to use browser's localstorage: http://stackoverflow.com/questions/17309199/how-to-send-variables-from-one-file-to-another-in-javascript?answertab=votes#tab-top
    // more info also at: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
    var person = _searched_people[_index];
    var rows = "";
    var officehours = " - ";
    var office = "";
    if (_personRoomTouched) {clearTimeout(_personRoomTouchedTimerID); _personRoomTouchedTimerID = setTimeout(function() {_personRoomTouched = false;}, 1000);} // This prevents the liveSearchResults div from appearing when a SPA page is changed and a search is still on the go.
    $(window.location.hash + " input.input_search_bar")[0].value = _searched_people[_index].name; // Write the name of the person in the searchbar
    // Based on the office hours retrieved from the database, we will format it as a table:
    if (person.officehours != " ") {for (k = 0; k < person.officehours.length; k++) {
        if (person.officehours[k] != null) {
            var hour_minute = person.officehours[k].split(","); // split works as a tokenizer, in this case the token is ','
            rows += "<tr><td>"+ hour_minute[0]+":"+ hour_minute[1] +"</td><td>"+ hour_minute[2]+":"+ hour_minute[3] +" </td></tr>";
        }
    } officehours = "<table>"+rows+"</table>"}
    // Now we will parse the office text searching for any number. If a number is found, this will be highlighted as a link:
    if (person.office != null) {
        office = person.office.replace(/[0-9]+/g, function myFunction(x){
            setTimeout(function() {
                $("[data-id='popup-office']").addClass("anima_showPopUp"); // Shows the tooltip for the office label"
            },1500)

            $("#spa_contact").scroll(function(){
                if($(this).scrollTop() > 150){
                    $("[data-id='popup-office']").removeClass("anima_showPopUp");
                    $("[data-id='popup-office']").addClass("anima_hidePopUp");
                }
            });
            return "<a data-transition='slide' ontouchend='if(_preventClick){_preventClick=false;return true;}; linkSearch(this.innerHTML)' ontouchmove='_preventClick=true;'>"+x+"</a>"; // In this case 'x' is the item/result obtained from the match of the regular expression. You coud have also used "person.office.match(/[0-9]+/g);"
        });
        // More info at: http://www.w3schools.com/jsref/jsref_replace.asp
    } else {
        office = "-";
    }
    document.getElementById("p_profile_header").innerHTML = ((person.name != null) ? person.name : "-"); // Name and surname
    document.getElementById("div_profile_body").innerHTML =
    "<p>POSITION: </p><p>" + ((person.position != null) ? person.position : "-") + "</p>" +
    "<p>FACULTY: </p><p>" + ((person.faculty != null) ? person.faculty : "-") + " <span class='popUptooltip' data-id='popup-office' ontouchend=\"$(this).removeClass('anima_showPopUp'); $(this).addClass('anima_hidePopUp')\">You can check here his/her office!</span></p>"+
    "<p>OFFICE: </p><p>" + office + "</p>"+
    "<p>OFFICE HOURS: </p><p>" + ((rows != "") ? officehours : "-") +"</p>" +
    "<p>EMAIL: </p><p>" + ((person.email != null) ? person.email : "-") + "</p>"+
    "<p>PHONE: </p><p>" + ((person.phone != null) ? person.phone : "-") + "</p>"+
    "<p>EXTENSION: </p><p>" + ((person.extension != null) ? person.extension : "-") + "</p>"+
    "<p>FAX: </p><p>" + ((person.fax != null) ? person.fax : "-") + "</p>"+
    "<p>PERSONAL WEBSITE: </p><p>" + ((person.website != null) ? person.website : "-") + "</p>"+
    "<p>LINKEDIN: </p><p>" + ((person.linkedin != null) ? person.linkedin : "-") + "</p>"+
    "<p>WORKING AT DeustoTech?: </p><p>" + ((person.dtech) ? "Yes" : "No") + "</p>"+
    "<p>NOTES: </p><p>" + ((person.notes != null) ? person.notes : "-") + "</p>";

    // Now, at the end, we try to silently log in to user's Google account in case he/she logged in before:
     silentLoginOAuth();
}

// This is called when SPA EditContact is loaded
  function loadEditContactDetails() {
    var person = _searched_people[_index];
    var rows = "";
    var officehours = "";
    var office = "";
    var input_yesno = "";
    _removedRows = []; // we reset the variable just in case
    _amountOfRowsAdded = -1; // Set this to -1, otherwise 'add_row' won't work (due to the increment)
    _editingInProgress = false; // we reset the variable just in case
    _carrete_horas = ""; // we reset the variable just in case
    _carrete_minutos = ""; // we reset the variable just in case
    if (_personRoomTouched) {clearTimeout(_personRoomTouchedTimerID); _personRoomTouchedTimerID = setTimeout(function() {_personRoomTouched = false;}, 1000);} // This prevents the liveSearchResults div from appearing when a SPA page is changed and a search is still on the go.
    $(window.location.hash + " input.input_search_bar")[0].value = _searched_people[_index].name; // Write the name of the person in the searchbar
    // We will generate the "carretes" (in spanish) representing 'hours' and 'minutes':
    // hours:
    for (var h = 0; h < 24; h++) {
        var num = "";
        if (h < 10) {num = "0"+h} else {num = h}
        _carrete_horas += "<option value='"+num+"'>"+num+"</option>"
    }
    // minutes:
    for (var h = 0; h < 60; h++) {
        var num = "";
        if (h < 10) {num = "0"+h} else {num = h}
        _carrete_minutos += "<option value='"+num+"'>"+num+"</option>"
    }
    // Based on the office hours retrieved from the database, we will format it as a table:
    if (person.officehours != null) {for (k = 0; k < person.officehours.length; k++) {
        if (person.officehours[k] == null) {continue;} // This way, we skip erros when reading null values within the officehours array
        var hour_minute = person.officehours[k].split(","); // split works as a tokenizer, in this case the token is ','
        var dropdowns =
        "<fieldset id='editContact_officehours"+k+"' data-role='controlgroup' data-type='horizontal' data-mini='true' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true')\">"+
            "<select name='editContact_dropdown_startHour"+k+"' id='editContact_dropdown_startHour"+k+"' data-corners='false'>"+
                _carrete_horas.replace("'"+hour_minute[0]+"'", "'"+hour_minute[0]+"' selected='true'")+
            "</select>"+
            "<p>:</p>" +
            "<select name='editContact_dropdown_startMinute"+k+"' id='editContact_dropdown_startMinute"+k+"' data-corners='false'>"+
                _carrete_minutos.replace("'"+hour_minute[1]+"'", "'"+hour_minute[1]+"' selected='true'")+
            "</select>"+
            "<p>-</p>" +
            "<select name='editContact_dropdown_endHour"+k+"' id='editContact_dropdown_endHour"+k+"' data-corners='false'>"+
                _carrete_horas.replace("'"+hour_minute[2]+"'", "'"+hour_minute[2]+"' selected='true'")+
            "</select>"+
            "<p>:</p>" +
            "<select name='editContact_dropdown_endMinute"+k+"' id='editContact_dropdown_endMinute"+k+"' data-corners='false'>"+
                _carrete_minutos.replace("'"+hour_minute[3]+"'", "'"+hour_minute[3]+"' selected='true'")+
            "</select>"+
        "</fieldset>";
        rows += "<tr><td>"+ dropdowns + " </td><td><button ontouchend=\"if(_preventClick){_preventClick=false;return true;};$(this).parents().remove('tr'); _editingInProgress = true; _removedRows.push("+k+");\" ontouchmove='_preventClick=true;' class='btn_delete_row ui-btn ui-icon-delete ui-btn-icon-notext ui-corner-all ui-mini'></button></td></tr>";
        _amountOfRowsAdded = k; // We update the amount of rows that were added to the GUI starting at 0 index! It's like a counter.
    } officehours = "<table><tbody>"+rows+"</tbody></table><button ontouchend='if(_preventClick){_preventClick=false;return true;};add_row(); _editingInProgress = true;' ontouchmove='_preventClick=true;' class='btn_add_row ui-btn ui-btn-inline ui-icon-plus ui-btn-icon-left' data-corners='false'>Add row</button>"}
    // Now we will see whether the person is working at DeustoTech or not, and set the widget accordingly:
    if (person.dtech) {
        input_yesno = "<input name='editContact_radioButton_deustotech' id='editContact_radioButton_deustotech_yes' value='true' checked='checked' type='radio'><label for='editContact_radioButton_deustotech_yes'>Yes</label><input name='editContact_radioButton_deustotech' id='editContact_radioButton_deustotech_no' value='false' type='radio'><label for='editContact_radioButton_deustotech_no'>No</label>"
    }
    else {
        input_yesno = "<input name='editContact_radioButton_deustotech' id='editContact_radioButton_deustotech_yes' value='true' type='radio'><label for='editContact_radioButton_deustotech_yes'>Yes</label><input name='editContact_radioButton_deustotech' id='editContact_radioButton_deustotech_no' value='false' checked='checked' type='radio'><label for='editContact_radioButton_deustotech_no'>No</label>"
    }
    // Now we add the corresponding form fields in the page:
    document.getElementById("div_profile_editContact_header").innerHTML = "<img src='img/profilepic.png' alt='profile pic' />" +
                                                                        "<textarea name='editContact_input_name' id='editContact_input_name' placeholder='Name and surname' data-corners='false' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true');\">"+((person.name != null) ? person.name : "")+"</textarea>"
    document.getElementById("div_profile_editContact_body").innerHTML =
    "<p>POSITION: </p>" + "<input id='editContact_input_position' placeholder='Current position, job or task at the moment' data-corners='false' data-clear-btn='true' type='text' name='editContact_input_position' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true');\" onreset='_editingInProgress = true;'  value='"+((person.position != null) ? person.position : "")+"'>" +
    "<p>FACULTY: </p>" + "<input id='editContact_input_faculty' placeholder='Faculty name he/she belongs to' data-corners='false' data-clear-btn='true' type='text' name='editContact_input_faculty' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true');\" onreset='_editingInProgress = true;'  value='"+((person.faculty != null) ? person.faculty : "")+"'>" +
    "<p>OFFICE: </p>" + "<input id='editContact_input_office' placeholder='Office number or name' data-corners='false' data-clear-btn='true' type='text' name='editContact_input_office' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true');\" onreset='_editingInProgress = true;'  value='"+((person.office != null) ? person.office : "")+"'>" +
    "<p>OFFICE HOURS: </p>" + officehours +
    "<p>EMAIL: </p>" + "<input id='editContact_input_email' placeholder='Email address' data-corners='false' data-clear-btn='true' type='text' name='editContact_input_email' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true');\" onreset='_editingInProgress = true;'  value='"+((person.email != null) ? person.email : "")+"'>" +
    "<p>PHONE: </p>" + "<input id='editContact_input_phone' placeholder='Land line or mobile number' data-corners='false' data-clear-btn='true' type='number' name='editContact_input_phone' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true');\" onreset='_editingInProgress = true;'  value='"+((person.phone != null) ? person.phone : "")+"'>" +
    "<p>EXTENSION: </p>" + "<input id='editContact_input_extension' placeholder='Phone extension, e.g. 2548' data-corners='false' data-clear-btn='true' type='number' name='editContact_input_extension' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true');\" onreset='_editingInProgress = true;'  value='"+((person.extension != null) ? person.extension : "")+"'>" +
    "<p>FAX: </p>" + "<input id='editContact_input_fax' placeholder='Fax number' data-corners='false' data-clear-btn='true' type='number' name='editContact_input_fax' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true');\" onreset='_editingInProgress = true;'  value='"+((person.fax != null) ? person.fax : "")+"'>" +
    "<p>PERSONAL WEBSITE: </p>" + "<input id='editContact_input_website' placeholder='Personal or corporate website' data-corners='false' data-clear-btn='true' type='url' name='editContact_input_website' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true');\" onreset='_editingInProgress = true;'  value='"+((person.website != null) ? person.website : "")+"'>" +
    "<p>LINKEDIN: </p>" + "<input id='editContact_input_linkedin' placeholder='Linkedin profile URL' data-corners='false' data-clear-btn='true' type='url' name='editContact_input_linkedin' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true');\" onreset='_editingInProgress = true;'  value='"+((person.linkedin != null) ? person.linkedin : "")+"'>" +
    "<p>WORKING AT DeustoTech?: </p> <fieldset id='editContact_deustotech' data-role='controlgroup' data-type='horizontal' data-theme='b' data-corners='false' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true');\">" + input_yesno + "</fieldset>" +
    "<p>NOTES: </p>" + "<textarea name='editContact_input_notes' id='editContact_input_notes' placeholder='Write anything you consider interesting or an aside note' data-corners='false' onchange=\"_editingInProgress = true; $(this).attr('data-changes', 'true');\">"+((person.notes != null) ? person.notes : "")+"</textarea>";
    // I'm not sure whether this is necessary or not, but when adding dynamically content to the DOM with jQuery Mobile
    // it may happen that the styles are not set approptiatelly. To fix this, you have to refresh somehow the content with "enhanceWithin"
    // More info at: http://stackoverflow.com/questions/14550396/jquery-mobile-markup-enhancement-of-dynamically-added-content
    $("#div_profile_editContact_header").enhanceWithin();
    $("#div_profile_editContact_body").enhanceWithin();
}

// Adds/Appends an HTML row within the SPA EditContact
  function add_row() {
    // Now we are defining and declaring a standard row with the corresponding dropdown elements. This structure will be added every time the user taps on "Add Row":
    // First of all, let's see how many rows have already been added and we will follow up that number:
    _amountOfRowsAdded++;
    var standard_row =
    "<tr><td><fieldset id='editContact_officehours"+_amountOfRowsAdded+"' data-role='controlgroup' data-type='horizontal' data-mini='true' data-changes='true' onchange='_editingInProgress = true;'>"+ // in this ocassion (adding a new row) there is no need to add handler for onchange method detecting wethere there has been a change or not, because whenever you add something, it will always be NEW.
        "<select name='editContact_dropdown_startHour"+_amountOfRowsAdded+"' id='editContact_dropdown_startHour"+_amountOfRowsAdded+"' data-corners='false' >"+
            _carrete_horas+
        "</select>"+
        "<p>:</p>" +
        "<select name='editContact_dropdown_startMinute"+_amountOfRowsAdded+"' id='editContact_dropdown_startMinute"+_amountOfRowsAdded+"' data-corners='false'>"+
            _carrete_minutos+
        "</select>"+
        "<p>-</p>" +
        "<select name='editContact_dropdown_endHour"+_amountOfRowsAdded+"' id='editContact_dropdown_endHour"+_amountOfRowsAdded+"' data-corners='false'>"+
            _carrete_horas+
        "</select>"+
        "<p>:</p>" +
        "<select name='editContact_dropdown_endMinute"+_amountOfRowsAdded+"' id='editContact_dropdown_endMinute"+_amountOfRowsAdded+"' data-corners='false'>"+
            _carrete_minutos+
        "</select>"+
    "</fieldset></td><td><button ontouchend=\"if(_preventClick){_preventClick=false;return true;}; $(this).parents().remove('tr'); _editingInProgress = true; _removedRows.push("+_amountOfRowsAdded+");\" ontouchmove='_preventClick=true;' class='btn_delete_row ui-btn ui-icon-delete ui-btn-icon-notext ui-corner-all ui-mini'></button>"+
    "</td></tr>";
    $($("#spa_edit_contact table").children()[0], this).append(standard_row).enhanceWithin(); // Here, as it happens in "loadEditContactDetails" function, it is necessary to refresh the elements for jQuery styles to work.
}

// This function is triggered when any office number with a link has been pressed. It puts the pressed room/place within the search bar
// and searches for it.
  function linkSearch(x) {
    _searched_rooms = [];
    $(window.location.hash + " input.input_search_bar")[0].value = x; // Write the name of the room in the searchbar
    _linkSearch = true;
    livesearch(x);
}

// This method is called in the 'onLoad' event handler of the map.html page
  function loadMap() {
    console.log("LOADING ROOM... "+ _searched_rooms[_index][0].label);
    _floor = _searched_rooms[_index][1]; // we assign the floor number to this global variable in order to decide what map to show later on.
    _sameFloor = true; // we want to load the destination image first and in the front side of the jQuery flip plugin.
    _allowYOUlabel = false; // we reset the boolean
    if (!_front) {switchMaps();} // we reset the variable to its original value
    if (_personRoomTouched) {clearTimeout(_personRoomTouchedTimerID); _personRoomTouchedTimerID = setTimeout(function() {_personRoomTouched = false;}, 1000);} // This prevents the liveSearchResults div from appearing when a SPA page is changed and a search is still on the go.
    $(window.location.hash + " input.input_search_bar")[0].value = _searched_rooms[_index][0].label; // Write the number of the room in the searchbar
    $("#floor_label").addClass("anima_magician");

    retrieveMap(_floor, function () { // Here we are retrieving the map corresponding to the floor given by the room[] array.
        locateUser(); // This call executes all the algorithms to locate the person on the map (trilateration, drawing points and labels etc.)

        // We draw the orange destination image point on the map and the corresponding label too:
        var dest_circle = document.getElementById("destinationPoint_circle");
        var dest_label = document.getElementById("p_dest_label");
        dest_circle.style.visibility="visible";
        dest_circle.style.left = parseInt(_searched_rooms[_index][0].x) - 35 +_paddingMap +"px"; // '35' is the radius of the circle's image declared at map.html. It is necessary to make the circle centered.
        dest_circle.style.top = parseInt(_searched_rooms[_index][0].y) - 35 +_paddingMap +"px"; // '35' is the radius of the circle's image declared at map.html. It is necessary to make the circle centered.
        dest_label.style.left= parseInt(_searched_rooms[_index][0].x) + 40 +_paddingMap +"px";
        dest_label.style.top= parseInt(_searched_rooms[_index][0].y) + 40 +_paddingMap +"px";
        dest_label.innerHTML=_searched_rooms[_index][0].label;
        dest_label.style.visibility="visible";
        _destX = _searched_rooms[_index][0].x; // Coordinate X of destination office/room
        _destY = _searched_rooms[_index][0].y; // Coordinate Y of destination office/room

        // Now, we pan over the floor image to show the corresponding spot to the user:
        // This is done thanks to the Event Listener attached to the 'img' DOM element with Id: "map".
        // So, at this moment in the code, panANDzoom should be called!

        // Now, at the end, we try to silently log in to user's Google account in case he/she logged in before:
        silentLoginOAuth();
    });
}

// This method pans and zooms over the image/map.
// It waits for the second map to load to avoid misbihavors
  function panANDzoom() {
    $("#map_wrapper").panzoom("resetPan", false); // This resets the image's position to the origin of coordinates
    $("#map_wrapper").panzoom("resetZoom", false); // This resets the image's zoom to the original zoom value
    $("#map_wrapper").panzoom("setMatrix", [1,0,0,1,0,0]); // This resets the image's matrix to default and initial values.
    // Now we will get the focus of the source point so that the user can see where she/he has to go. We also want to specify a certain zoom level.
    // To do so, we have to pan over the map image and apply a certain level of zoom. The zoom is performed based on a certain focal point.
    // To avoid troubles with the position, we will make that focal point the center point of the window.
    // More info about offset (just in case): https://api.jquery.com/offset/
    $("#map_wrapper").panzoom("pan", -_destX -_paddingMap +(window.innerWidth/2), -_destY -_paddingMap +(window.innerHeight/2), {relative: true}); // Since we have performed several changes in the position and zoom properties, it's safer to pan with 'relative' option set to true.
    $('#map_wrapper').panzoom('zoom', 0.5, {focal: {clientX:window.innerWidth/2,clientY:(window.innerHeight/2)}, animate:true});
}

// Shows/loads the image within the DOM element.
// "_sameFloor" boolean indicates whether to load the map/image just as a unique floor or as a second floor. This might occur if the user and the room are in different floors.
  function showMap() {
    if (_sameFloor) {
        // We show the image as a unique map. This could mean that the user and the room are at the same floor.
        var map = document.getElementById("map");
        map.src = _reva;
        $(".jqueryFlip-front_floor p").html(ordinal_suffix_of(_floor) + " <br><span>floor</span>");
    } else {
        // We show the image as a second map/floor. This means clearly, that the user and the room are not at the same floor.
        var map_sourcepoint = document.getElementById("map_sourcepoint");
        map_sourcepoint.src = _reva;
        $(".jqueryFlip-back_floor p").html(ordinal_suffix_of(_currentfloor) + " <br><span>floor</span>");
    }

    // This inner function just writes "th", "nd" and "rd" whenever it is required based on the ordinality of the number given
    function ordinal_suffix_of(i) {
        var j = i % 10,
        k = i % 100;
        if (j == 1 && k != 11) {
            return i + "st";
        }
        if (j == 2 && k != 12) {
            return i + "nd";
        }
        if (j == 3 && k != 13) {
            return i + "rd";
        }
        return i + "th";
    }
}

// A function to swap between two maps
  function switchMaps() {
    $('#card').flip('toggle');
    $('#floor_label').flip('toggle');
    if (_front) {_front = false;} else {_front = true;}
    var youPoint_circle = document.getElementById("youPoint_circle");
    var dest_point = document.getElementById("destinationPoint_circle");
    var you_label = document.getElementById("p_you_label");
    var dest_label = document.getElementById("p_dest_label");
    // var upstairs_downstairs = document.getElementById("p_upstairs_downstairs");
    if (_front) {
        you_label.style.visibility = "hidden";
        youPoint_circle.style.visibility = "hidden";
        dest_label.style.visibility = "visible";
        dest_point.style.visibility = "visible";
    } else {
        _allowYOUlabel ? you_label.style.visibility = "visible" : null ; // This if is necessary to hide the YOU label in the corresponding scenario. Otherwise, it would appear without any meaning.
        _allowYOUlabel ? youPoint_circle.style.visibility = "visible" : null; // This if is necessary to hide the YOU label in the corresponding scenario. Otherwise, it would appear without any meaning.
        dest_label.style.visibility = "hidden";
        dest_point.style.visibility = "hidden";
    }
    // upstairs_downstairs.style.visibility = "visible";
}

// This functions checks two booleans. Both booleans are set during application runtime.
// All depends on whether there exists a communication with the beacons and if the user is at the same floor as the one he/she is searching for.
  function updateYOUlabel() {
    console.log("sameFloor = " + _sameFloor + " | YOU label visible = " + _allowYOUlabel);
    var youPoint_circle = document.getElementById("youPoint_circle"); // This is the red point corresponding to YOU
    var you_label = document.getElementById("p_you_label"); // This is the red label corresponding to YOU
    if ((_sameFloor && _allowYOUlabel ) || (!_front && _allowYOUlabel)) {
        // We show the corresponding label and the svg point:
        // Note that the label and the source image point corresponding to the room number is managed in "loadMap()" function.
        // Note that when two maps are loaded and shown, the label and source image point is handled in "evothings.eddystone.js" script.
        youPoint_circle.style.visibility="visible";
        you_label.style.visibility="visible";
    } else {
        // We hide the label and the source image point because in this scenario, the user and the floor he/she is searching are not the same:
        // Note that the label and the source image point corresponding to the room number is managed in "loadMap()" function
        youPoint_circle.style.visibility="hidden";
        you_label.style.visibility="hidden";
    }
}
// This function removes the possibility of switching between maps because it is supposed that the user and the room he/she is searching for are in the same floor.
// So, now, we go back to the normal scenario.
  function removeDuplicatedMaps() {
    if (!_front) {switchMaps();}
    var you_label = document.getElementById("p_you_label");
    var dest_label = document.getElementById("p_dest_label");
    var youPoint_circle = document.getElementById("youPoint_circle");
    var dest_point = document.getElementById("destinationPoint_circle");
    $("#spa_map #footer > img:first-child").removeClass("anima_magician");
    //$("#floor_label").removeClass("anima_magician");
    you_label.style.visibility = "visible";
    dest_label.style.visibility = "visible";
    youPoint_circle.style.visibility = "visible";
    dest_point.style.visibility = "visible";
}

// This function shows a tooltip with the message given in the parameter when the user presses and maintains the finger over the object.
// When the user maintains the pressure over that object this tooltip will appear explaining the meaning of that button, object or whatever.
  function showOnPressedToolTip(string){
    _tooltipTimer = setTimeout(function () {
        window.plugins.toast.show(string, 'long', 'bottom', null, function(e){console.log("error showing toast:");console.log(e);});
    }, 800);
}

// This function shows a tooltip with the message given in the parameter.
// For the moment, the duration and position of the Toast message is not editable.
  function showToolTip(string) {
    window.plugins.toast.show(string, 'long', 'bottom', null, function(e){console.log("error showing toast:");console.log(e);});
}

// Aborts the tooltip timer, and therefore, the toast message in this case
  function abortToolTipTimer(){
    clearTimeout(_tooltipTimer);
}

// This function performs several things before loading the map html page within the SPA (Single Page Application) context.
  function goMap(index) {
    // I used to do this in a different way, using localstorage: http://stackoverflow.com/questions/17309199/how-to-send-variables-from-one-file-to-another-in-javascript?answertab=votes#tab-top
    // more info here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
    _index = index; // Now we assign the index to a global variable so as to know which variable to use in "searched room" and "searched people"
    cleanGUI();
    loadMap();
    parenLasRotativas();
}

// This function performs several things before loading the contact html page within the SPA (Single Page Application) context.
  function goContact(index) {
    // I used to do this in a different way, using localstorage: http://stackoverflow.com/questions/17309199/how-to-send-variables-from-one-file-to-another-in-javascript?answertab=votes#tab-top
    // more info here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
    _index = index; // Now we assign the index to a global variable so as to know which variable to use in "searched room" and "searched people"
    cleanGUI();
    loadContactDetails();
    parenLasRotativas();
}

// This function performs several things before loading the "edit contact" page within the SPA (Single Page Application) context.
  function goEditContact() {
    if (_signedInUser != null) {
        cleanGUI();
        window.location = "#spa_edit_contact";
        loadEditContactDetails();
    } else {
        signInOAuth();
    }
}

// This function performs several things before loading the "edit map" page within the SPA (Single Page Application) context.
  function goEditMap() {
    showToolTip("Currently this feature is not available :(  I'm sorry!");
    // window.location = "#spa_mapEdit";
}

// This function tries to hide the footer when the soft keyboard is shown in the screen and tries to display it when the soft keyboard disappears. Currently it does not work very well.
// _input is a boolean representing whether an text input has gained focus or not.
// _viewportHeight is the Height of the Viewport of the application at some point in time.
// _softKeyboard is a boolean representing whether the soft keyboard is shown or not.
  function softKeyboard(height) {
    var piezazo = document.getElementById("footer");
    if (!_input || (_input && height > _viewportHeight && _softKeyboard)) {piezazo.style.display = "initial"; _softKeyboard = false} else if (_input && !_softKeyboard ) {piezazo.style.display = "none"; _softKeyboard = true;}
    _viewportHeight = height;
}

// PLUGIN CORDOVA-PLUGIN-GOOGLE+ (OAuth):
// Ojo al dato, con este plugin lo que hace es autenticarte con alguna cuenta que tengas vinculada en el propio dispositivo
// Es decir, no te deja introducir email y contraseña como lo harias mediante una pagina web. Has de acceder mediante una cuenta
// vinculada/registrada en el dispositivo. Es un approach mas nativo que otras opciones. Sí que te deja la opcion de vincular una cuenta.
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
        try {
            window.plugins.googleplus.login(
                {
                    'webClientId': _webClientID // optional clientId of your Web application from Credentials settings of your project - On Android, this MUST be included to get an idToken. On iOS, it is not required.
                },
                function (obj) {
                    // On success:
                    console.log("Sign in successful!");
                    afterSignedIn(obj);
                    goEditContact(); // This function is called again because after successful log in, the page is not changed automatically.
                },
                function (msg) {
                    // On error:
                    showToolTip("An unexpected error occurred while authenticating. Try it again later! :(");
                    console.log("WARNING! (signInOAuth). Probably the user has cancelled the operation: " + msg);
                }
            );
        } catch (e) {
            // On error:
            console.log("ERROR! (signInOAuth): " + e);
        }
}

// This function logs out the user from the app. It forgets the OAuth2 token as well as which account was used to log in.
  function disconnectOAuth() {
    try {
        window.plugins.googleplus.disconnect(
            function (msg) {
                // On success:
                console.log("Disconnection successful!");
                console.log(msg);
                showToolTip("Signed out was successfully! Come back soon ;-)");
                // We reset the variable concerning the user and hide the logging button and text.
                _signedInUser = null;
                $(".btn_signout").addClass("anima_fade");
                $(".p_oauth_name").addClass("anima_fade");
                $(".p_oauth_email").addClass("anima_fade");
            }
        );
    } catch (e) {
        // On error:
        console.log("ERROR! (disconnectOAuth): " + e);
    }
}

// This funtion tries to sign in silently within the Google account in case the user was already signed in before and did not sign out.
// Even though the app was closed, the logging information will remain somewhere so that it can be accessed again without forcing the user to introduce again the credentials.
  function silentLoginOAuth() {
    try {
        window.plugins.googleplus.trySilentLogin(
            {
                'webClientId': _webClientID // optional clientId of your Web application from Credentials settings of your project - On Android, this MUST be included to get an idToken. On iOS, it is not required.
            },
            function (obj) {
                // On success:
                console.log("Silent login successful!");
                afterSignedIn(obj);
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

// This function is executed after the user has signed in. It displays her/his name and email. The "sign out" button appears too.
  function afterSignedIn(user) {
    $(".btn_signout").css("display", "inline"); $(".btn_signout").removeClass("anima_fade");
    $(".p_oauth_name").css("display", "inline"); $(".p_oauth_name").removeClass("anima_fade");
    $(".p_oauth_email").css("display", "inline"); $(".p_oauth_email").removeClass("anima_fade");
    $(".p_oauth_name").text(user.displayName +",");
    $(".p_oauth_email").text(user.email);
    _signedInUser = user; // The containing fields are: 'email', 'idToken', 'userId', 'displayName', 'imageUrl'. More info at: https://github.com/EddyVerbruggen/cordova-plugin-googleplus
}

// This function prompts the user either saving (or not) the changes made or discarding the changes made.
// Meaning of the bolean (bol) variable:
// 1 = SAVE
// 0 = CANCEL
  function prompt_savecancel(action, bol, callback) {
    // bolean meaning:
    // 1 = SAVE
    // 0 = CANCEL
    if (bol == 1 && !_editingInProgress) {
        if (!_showingDialog) {
            _showingDialog = true;
            navigator.notification.alert("There is nothing to SAVE! 😃", function() {_showingDialog = false;}, "Nothing to save", "Oki Doki!");
            return;
        }
    }
    if (!_showingDialog) {
        _showingDialog = true;
        navigator.notification.confirm("Are you sure you want to " + action+"?", aux, action, ["Yes", "No"]);
    }

    function aux(pressedIndex) {
        _showingDialog = false;
        if(bol==1) {
            // It is not necessary to define a Swich statement because we are just going to take care of response #1.
            // This statement corresponds to saying 'YES' to SAVE.
            if(pressedIndex == 1) {savechanges();} // SAVE
        } else if (bol==0) {
            // It is not necessary to define a Swich statement because we are just going to do someting with response #1.
            // This statement corresponds to saying 'YES' to DISCARD.
            if(pressedIndex == 1 && callback == undefined) {
                navigator.app.backHistory();
            } else if (pressedIndex == 1) {
                callback();
            }
        } // END if
    }
}

// This function saves the changes done on the EditContact SPA. An ajax call is made passing as parameters
// the tokenID of the OAuth from Google, the changes done in the form of a dictionary and the contact with
// the original information.
  function savechanges() {
    // The following dictionary or Object will store key-value records regarding the changes made by the user.
    // More info at: http://stackoverflow.com/questions/456932/hash-table-in-javascript#answer-457035
    // https://www.tutorialspoint.com/javascript/javascript_objects.htm
    // http://www.w3schools.com/js/js_objects.asp
    var changes_dictionary = {}
    $("[data-changes]").each(function() {
        var id_attribute_name = this.id.substring(this.id.lastIndexOf("_")+1); // The 'id_attribute_name' is a substring of the ID of the DOM element. Its purpose is to identify which property was changed e.g. position, email, phone etc.

        if (id_attribute_name == "deustotech") { // This statement is for the radio buttons of 'DeustoTech' item
            changes_dictionary["deustotech"] = $("#"+this.id+" input:checked").val(); // 'val' captures the value set of the radio buttons
        } else if (id_attribute_name.includes("officehours")) { // This statement is for the 'office hours' item
            $("#"+this.id+" select").each(function(){
                var row = this.id.substring(this.id.search(/[0-9]/)); // the row number of the officehours item, e.g. 10:00 - 12:00
                if (changes_dictionary["officehours"] != null) {
                    if(changes_dictionary["officehours"][row] != null) {
                        // This occurs when the array representing the four 'selects' already exists
                        changes_dictionary["officehours"][row].push(this.value);
                    } else {
                        // This occurs when a new array has to be created for a new row.
                        changes_dictionary["officehours"][row] = [this.value];
                    }
                } else {
                    // This occurs when 'changes_dictionary' is empty for the first time. A new array is created and then the value caputes is assigned:
                    changes_dictionary["officehours"] = [];
                    changes_dictionary["officehours"][row] = [this.value];
                }
            });
        } else { // This statement is for the rest of the options
            changes_dictionary[id_attribute_name] = this.value;
        }
    })
    // Now, remember that the rows of "officehours" array that were deleted intentionally by the user are represented as UNDEFINED (by default in Javascript).
    // e.g. changes_dictionary["officehours"][0] = unefined;
    // Even though before deleting the rows there was information in there, now, it's undefined. Thus, ensuring the system deletes
    // the corresponding office hours in server-side. '_removedRows' array is used to save the indexes of the rows deleted by the user.
    // So, now we will loop over the "_removedRows" in order to set NULL value to the corresponding rows in "changes_dictionary['officehours']".
    // This is done like that, becasue there has to be a way to figure out when the row was DELETED and when the row contains a DEFAULT (predefined, not changed, coming from the DB) value.
    for (k=0; k < _removedRows.length; k++) {
        if (changes_dictionary["officehours"] == undefined) {changes_dictionary["officehours"] = [];} // This is necessary for the cases where the DEFAULT rows are deleted without adding more.
        changes_dictionary["officehours"][_removedRows[k]] = null;
    }
    // There is one thing to take into consideration, in Javascript there exist UNDEFINED values, which is somewhat similar to NULL values.
    // BUT! When you "stringify" a Javascript object and you obtain a JSON representation, there are NOT "UNDEFINED" values in JSON. So,
    // you cannot represent an UNDEFINED values in JSON. This has to be done in a different way.
    // In this case, the rows that were not touched by the user (UNDEFINED within the changes_dictionary["officehours"]), are going to take
    // the value -1. This int will represent that the row was not changed.
    if (changes_dictionary["officehours"] != null) {
        for (l=0; l < changes_dictionary["officehours"].length; l++) { // YOU CANNOT do "for(l in changes_dictionary["officehours"])" because it eventually takes only indexes with real values, not the ones with UNDEFINED!
        if (changes_dictionary["officehours"][l] === undefined) {changes_dictionary["officehours"][l] = -1;}
        }
    }
    // After ALL this, in "changes_dictionary['officehours']" array, we will have rows with any of the following possible content:
    // · Useful information regarding 'officehours', e.g '23','00','14','15'
    // · -1 -> This corresponds to the rows that were not changed by the user but were loaded at the begining (info coming from the DB)
    // · NULL -> This corresponds to the rows that were intentionally deleted by the user
    // Remember that (http://www.w3schools.com/js/js_datatypes.asp):
    // null === undefined -> false
    // null == null -> true
    // null == undefined -> true !!

    // Now, it's time to make an AJAX call and send the data to server-side. The backend will process the requesst, saving the changes and
    // updating the database (local and remote):
    (function ajaxPOST() {
        $.ajax({type:"POST", url: _server_domain+'/editcontact?auth=admin', contentType:"application/json", data: JSON.stringify([_signedInUser.idToken, changes_dictionary, _searched_people[_index]]), success: function(staff_edited, status){
            // The parameter 'staff_edited' is the contact that was edited.
            // Server side sends back the contact to make it available here in client side to be able to use it now:
            console.log("[Client side]: Ajax POST request done successfuly (id= " + staff_edited._id+")");
            // status is a predefined string defined by jQuery, if the request is 200, then the status text is "success"
            if (status == "success") {syncDB(_db, _staffdb_name); _searched_people[_index] = staff_edited; loadContactDetails(); app.onBackButton(true);}
        }, statusCode: {400:function(){
            // Most likely this has happened because the authentication failed. Probably because the authentication token has expired.
            // Therefore, we should call silentLoginOAuth again:
            silentLoginOAuth(); ajaxPOST()}}, error: function(xhr,status,error) {checkInternetConnection(); console.log("warning in POST 'savechanges', AJAX call");console.log(error +":"+status);}});
    })();

}

// This function checks for Internet connection on the device. It makes use of the Cordova API "cordova.network.information" and
// a native function of the browser to check whether it is online or not.
  function checkInternetConnection() {
    if (navigator.connection.type === Connection.NONE || !window.navigator.onLine) {
        showToolTip("Seems like there is a network connection problem! Please check your WiFi or Data connection and try again 😢");
    }
}
