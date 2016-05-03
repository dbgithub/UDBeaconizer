// This function reads a txt file from local files:
function readTxtFile(file, loadStaffList) {
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
                // _tuples.splice(-1, 1); // Apparently this is not needed anymore. Remove the last item because is superfluos. More info of 'splice' at: http://www.w3schools.com/jsref/jsref_splice.asp
                // Heads up, the values you can store with JSON can be any of these: http://www.w3schools.com/json/json_syntax.asp
                loadStaffList(); // To ensure that the text file is read first and then the information loaded into the database, we call now this callback function now.
            }
        }
        ftxt.send(null); // 'send' sends a request to a server. In this case, we are not interested
        // More info about XMLhttprequest at: http://www.w3schools.com/ajax/ajax_xmlhttprequest_send.asp
    } else {
        alert('The File APIs are not fully supported by your browser.');
    } // END if
} // END readTxtFile

function readJsonFile (file, loadRooms) {
    // First of all, we check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var fjson = new XMLHttpRequest();
        fjson.open("GET", file, true); // 'true' means asynchronous
        // fjson.setRequestHeader("Content-Type","text/plain; charset=utf-16"); // This is not necessary
        fjson.onreadystatechange = function () // once the request finished this function is executed
        // more info at: http://www.w3schools.com/Ajax/ajax_xmlhttprequest_onreadystatechange.asp
        {
            if(fjson.readyState == 4) // aqui tendria que añadir: ""&& fjson.status == 200", pero en el browser del atom no funciona
            {
                _jsondata = JSON.parse(fjson.responseText); // Parse means going from JSON to javascript object
                // Heads up, the values you can store with JSON can be any of these: http://www.w3schools.com/json/json_syntax.asp
                loadRooms(); // To ensure that the text file is read first and then the information loaded into the database, we call now this callback function now.
            }
        }
        fjson.send(null); // 'send' sends a request to a server. In this case, we are not interested
        // More info about XMLhttprequest at: http://www.w3schools.com/ajax/ajax_xmlhttprequest_send.asp
    } else {
        alert('The File APIs are not fully supported by your browser.');
    } // END if
}

function readImageFile (file, showMap) {
    // First of all, we check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var fimage = new XMLHttpRequest();
        fimage.open("GET", file, true); // 'true' means asynchronous
        // fimage.setRequestHeader("Content-Type","image/png"); // This is not necessary
        fimage.responseType = "arraybuffer"; // If we had used 'blob' it wouldn't have worked in Phonegap, I don't knnow why. There is no way to make Phonegap to understand Blob type if it is not with the plugin "blob-util"
        fimage.onreadystatechange = function () // once the request finished this function is executed
        // more info at: http://www.w3schools.com/Ajax/ajax_xmlhttprequest_onreadystatechange.asp
        {
            if(fimage.readyState == 4) // aqui tendria que añadir: ""&& fimage.status == 200", pero en el browser del atom no funciona
            {
                // var response = fimage.response; // This doesn't work on Phonegap, but it does in Desktop browsers.
                // var response = new Blob([fimage.response], {type: "image/png"}); // This doesn't work on Phonegap, but it does in Desktop browsers.
                var responsee = blobUtil.createBlob([fimage.response], {type: 'image/png'}); // It creates a Blob out of the response of the HttpRequest. There is no way to make Phonegap to understand Blob type if it is not with the plugin "blob-util"
                _reva = blobUtil.createObjectURL(responsee);
                setTimeout(function() {
                    showMap(); //After ensuring we achieved correctly the URL we don't show the image
                }, 0)

                //More info about storing and reading Blob type images, XMLHttpRequest, storing any kind of file and blob-util plugin github page:
                //blob-util github page: https://github.com/nolanlawson/blob-util#blobToBinaryString
                // http://bl.ocks.org/nolanlawson/edaf09b84185418a55d9 (storing and reading Blob type images)
                // https://hacks.mozilla.org/2012/02/saving-images-and-files-in-localstorage/ (storing any kind of file)
                // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest (XMLHttpRequest)
                // https://msdn.microsoft.com/en-us/library/windows/apps/hh871381.aspx (requesting an image from a server using responseType)
            }
        }
        fimage.send(null); // 'send' sends a request to a server. In this case, we are not interested
        // More info about XMLhttprequest at: http://www.w3schools.com/ajax/ajax_xmlhttprequest_send.asp
    } else {
        alert('The File APIs are not fully supported by your browser.');
    } // END if
}


// function readImageFile (files, loadMaps) {
//     // First of all, we check for the various File API support.
//     if (window.File && window.FileReader && window.FileList && window.Blob) {
//         _maps = [];
//         console.log("FILES LENGTH:"+files.length);
//         // This loop iterates over all the map images and calls the method that save them in roomsdb database:
//         function loop(k) {
//             if (k < files.length) {
//                 console.log("K = " + k);
//                 var fimage = new XMLHttpRequest();
//                 fimage.open("GET", files[k], true); // 'true' means asynchronous
//                 // fimage.setRequestHeader("Content-Type","image/png"); // This is not necessary
//                 fimage.responseType = "arraybuffer"; // If we had used 'blob' it wouldn't have worked in Phonegap, I don't knnow why. There is no way to make Phonegap to understand Blob type if it is not with the plugin "blob-util"
//                 fimage.onreadystatechange = function () // once the request finished this function is executed
//                 // more info at: http://www.w3schools.com/Ajax/ajax_xmlhttprequest_onreadystatechange.asp
//                 {
//                     if(fimage.readyState == 4) // aqui tendria que añadir: ""&& fimage.status == 200", pero en el browser del atom no funciona
//                     {
//                         // var response = fimage.response; // This doesn't work on Phonegap, but it does in Desktop browsers.
//                         // var response = new Blob([fimage.response], {type: "image/png"}); // This doesn't work on Phonegap, but it does in Desktop browsers.
//                         var responsee = blobUtil.createBlob([fimage.response], {type: 'image/png'}); // It creates a Blob out of the response of the HttpRequest. There is no way to make Phonegap to understand Blob type if it is not with the plugin "blob-util"
//                         _maps.push(responsee);
//                         loop(++k);
//
//                         //More info about storing and reading Blob type images, XMLHttpRequest, storing any kind of file and blob-util plugin github page:
//                         //blob-util github page: https://github.com/nolanlawson/blob-util#blobToBinaryString
//                         // http://bl.ocks.org/nolanlawson/edaf09b84185418a55d9 (storing and reading Blob type images)
//                         // https://hacks.mozilla.org/2012/02/saving-images-and-files-in-localstorage/ (storing any kind of file)
//                         // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest (XMLHttpRequest)
//                         // https://msdn.microsoft.com/en-us/library/windows/apps/hh871381.aspx (requesting an image from a server using responseType)
//                     }
//                 }
//                 fimage.send(null); // 'send' sends a request to a server. In this case, we are not interested
//                 // More info about XMLhttprequest at: http://www.w3schools.com/ajax/ajax_xmlhttprequest_send.asp
//             } else {
//                 // This call goes here because otherwise JavaScript executes it whenever it wants and it makes my app crash
//                 console.log("K = " + k);
//                 setTimeout(function() {
//                     loadMaps();
//                 }, 0)
//             }// END if
//         } // END loop
//         loop(0); // Initial call to iterate recursively in the loop. This is done like that because otherwise you couldn't guarantee that a normal for loop was doing the job correctly adding all the images.
//     } else {
//         alert('The File APIs are not fully supported by your browser.');
//     } // END if
// }
