// This function reads a txt file from local files:
function readTxtFile(file, loadStaffList)
{
    // First of all, we check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var ftxt = new XMLHttpRequest();
        ftxt.open("GET", file, true); // 'true' means asynchronous
        // ftxt.setRequestHeader("Content-Type","text/plain; charset=utf-16"); // This is not necessary
        ftxt.onreadystatechange = function () // once the request finished this function is executed
        // more info at: http://www.w3schools.com/Ajax/ajax_xmlhttprequest_onreadystatechange.asp
        {
            if(ftxt.readyState == 4) // aqui tendria que añadir: ""&& ftxt.status == 200", pero en el browser del atom no funciona
            {
                var allText = ftxt.responseText;
                _tuples = allText.split("\n"); // It parses the text according to the given pattern returning an array. More info at: http://www.w3schools.com/jsref/jsref_split.asp
                console.log("array length:" + _tuples.length);
                _tuples.splice(-1, 1); // Remove the last item because is superfluos. More info of 'splice' at: http://www.w3schools.com/jsref/jsref_splice.asp
                console.log("array length:" + _tuples.length);
                // Heads up, the values you can store with JSON can be any of these: http://www.w3schools.com/json/json_syntax.asp
                loadStaffList(); // To ensure that the text file is read first and then the information loaded into the database, we call now this callback function.
            }
        }
        ftxt.send(null); // 'send' sends a request to a server. In this case, we are not interested
        // More info about XMLhttprequest at: http://www.w3schools.com/ajax/ajax_xmlhttprequest_send.asp
    } else {
        alert('The File APIs are not fully supported by your browser.');
    } // END if
} // END readTxtFile
