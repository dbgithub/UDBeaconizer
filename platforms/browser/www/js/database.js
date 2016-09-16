// This function fetches the databases from local, if they don't exist, then it creates the databases for the first time.
// After fetching the databases, it starts initializating the databases.
// Javascript is a MESS!! Due to the fact is single-thread, it handles the calls to the functions very weirdly.
// For this reason, sometimes you are not left with any other options than declaring callbacks (and using 'promises' whenever you can)
// in order to avoid race conditions! That's why the overall structure of the initialization of the database is done separating each function from each other.
// The logic goes as follows: first fetching occurs, then 'staff' database initialization, then 'rooms' database initialization and so on. Callbacks are
// called within the functions to avoid problems with race conditions or similar issues.
function fetchDB() {
    _db = new PouchDB(_staffdb_name); // Fetching the database for staff.
    _dbrooms = new PouchDB(_roomsdb_name); // Fetching the database for rooms.
    _dbbeacons = new PouchDB(_beacons_name); // Fetching the database for beacons.
    initializeDB();
}

// This function initializes the 'staff' database. Depending whether is the first time or not, it will create for the first time the database or
// sync the data from the remote database respetively (local database checks for updates in the remote database).
// Javascript is a MESS!! Due to the fact is single-thread, it handles the calls to the functions very weirdly.
// For this reason, sometimes you are not left with any other options than declaring callbacks (and using 'promises' whenever you can)
// in order to avoid race conditions! That's why the overall structure of the initialization of the database is done separating each function from each other.
// The logic goes as follows: first fetching occurs, then 'staff' database initialization, then 'rooms' database initialization and so on. Callbacks are
// called within the functions to avoid problems with race conditions or similar issues.
function initializeDB() {
    // STAFF database:
    _db.info().then(function (result) {
        // Now, if it is the first time, a local document is created for updating purposes, otherwise, we will look for changes:
        if (result.doc_count == 0) {createLocalDocument(_db); syncDB(_db, _staffdb_name);} else {checkChanges(_db, _db_alias, _staffdb_name);}
    }).catch(function (err) {
        console.log("error getting info about database:");
        console.log(err);
    });
    iniRoomsDB();
}

// This function initializes the 'rooms' database. Depending whether is the first time or not, it will create for the first time the database or
// sync the data from the remote database respetively (local database checks for updates in the remote database).
// Javascript is a MESS!! Due to the fact is single-thread, it handles the calls to the functions very weirdly.
// For this reason, sometimes you are not left with any other options than declaring callbacks (and using 'promises' whenever you can)
// in order to avoid race conditions! That's why the overall structure of the initialization of the database is done separating each function from each other.
// The logic goes as follows: first fetching occurs, then 'staff' database initialization, then 'rooms' database initialization and so on. Callbacks are
// called within the functions to avoid problems with race conditions or similar issues.
function iniRoomsDB() {
    //ROOMS database:
    _dbrooms.info().then(function (result) {
        // Now, if it is the first time, a local document is created for updating purposes, otherwise, we will look for changes:
        if (result.doc_count == 0) {_firstTime = true; createLocalDocument(_dbrooms); syncDB(_dbrooms, _roomsdb_name);} else {checkMapChanges(0, _dbrooms_alias, checkMapChanges);} // "CheckChanges" is callled within the "CheckMapchanges" function to
                                                                                                                                                                            // avoid updating the rooms database before the map images were able to
                                                                                                                                                                            // be updated.
    }).catch(function (err) {
        console.log("error getting info about database:");
        console.log(err);
    });
    iniBeaconsDB();
}

// This function initializes the 'beacons' database. Depending whether is the first time or not, it will create for the first time the database or
// sync the data from the remote database respetively (local database checks for updates in the remote database).
// Javascript is a MESS!! Due to the fact is single-thread, it handles the calls to the functions very weirdly.
// For this reason, sometimes you are not left with any other options than declaring callbacks (and using 'promises' whenever you can)
// in order to avoid race conditions! That's why the overall structure of the initialization of the database is done separating each function from each other.
// The logic goes as follows: first fetching occurs, then 'staff' database initialization, then 'rooms' database initialization and so on. Callbacks are
// called within the functions to avoid problems with race conditions or similar issues.
function iniBeaconsDB() {
    // BEACONS database:
    _dbbeacons.info().then(function (result) {
        // Now, if it is the first time, a local document is created for updating purposes, otherwise, we will look for changes:
        if (result.doc_count == 0) {createLocalDocument(_dbbeacons); syncDB(_dbbeacons, _beacons_name);} else {checkChanges(_dbbeacons, _dbbeacons_alias, _beacons_name);}
    }).catch(function (err) {
        console.log("error getting info about database:");
        console.log(err);
    });
}

// TO DELETE IN THE FUTURE! IT HAS BEEN IMPLEMENTED IN A DIFFERENT WAY TAKING INTO ACCOUNT CALLBACKS.
// This function creates/fetches databases.
// It syncs the local database with the remote database in case is needed.
// The local database checks for changes in the remote database looking for updates.
function createDB(whichDB) {
    console.log("Preferred adapters: "+ PouchDB.preferredAdapters); // Displays the list of adapters in order of preference for the browser. PouchDB tries using the first adapter, if not, tries the second one and etc.
    if (whichDB === "staff") {
        _db = new PouchDB(_staffdb_name); // Fetching or creating the database for staff.
        _db.info().then(function (result) {
            // Now, if it is the first time, a local document is created for updating purposes, otherwise, we will look for changes:
            if (result.doc_count == 0) {createLocalDocument(_db); syncDB(_db, _staffdb_name);} else {checkChanges(_db, whichDB, _staffdb_name);}
        }).catch(function (err) {
            console.log("error getting info about database:");
            console.log(err);
        });
    } else if (whichDB === "rooms") {
        _dbrooms = new PouchDB(_roomsdb_name); // Fetching or creating the database for rooms.
        _dbrooms.info().then(function (result) {
            // Now, if it is the first time, a local document is created for updating purposes, otherwise, we will look for changes:
            if (result.doc_count == 0) {_firstTime = true; createLocalDocument(_dbrooms); syncDB(_dbrooms, _roomsdb_name);} else {checkMapChanges(0, whichDB, checkMapChanges);} // "CheckChanges" is callled within the "CheckMapchanges" function to
                                                                                                                                                                                // avoid updating the rooms database before the map images were able to
                                                                                                                                                                                // be updated.
        }).catch(function (err) {
            console.log("error getting info about database:");
            console.log(err);
        });
    } else if (whichDB === "beacons") {
        _dbbeacons = new PouchDB(_beacons_name); // Fetching or creating the database for rooms.
        _dbbeacons.info().then(function (result) {
            // Now, if it is the first time, a local document is created for updating purposes, otherwise, we will look for changes:
            if (result.doc_count == 0) {createLocalDocument(_dbbeacons); syncDB(_dbbeacons, _beacons_name);} else {checkChanges(_dbbeacons, whichDB, _beacons_name);}
        }).catch(function (err) {
            console.log("error getting info about database:");
            console.log(err);
        });
    }
}

// Deletes the database given as an argument
function deleteDB(dbname) {
    dbase = new PouchDB(dbname);
    dbase.destroy().then(function (response) {
        // success
        console.log("Database deleted/removed successfully");
    }).catch(function (err) {
        console.log("error deleting the database:");
        console.log(err);
    });
}

// Shows database info
function DBinfo(db) {
    db.info().then(function (result) {
        var str =
        "DB name: " + result.db_name + "\n" +
        "doc count: "+ result.doc_count + "\n" +
        "update seq:" + result.update_seq + "\n" +
        "attachment format: " + result.idb_attachment_format + "\n" +
        "adapter: " + result.adapter + "\n" +
        "sqlite plugin: " + result.sqlite_plugin + "\n" +
        "websql encoding: " + result.websql_encoding;
        console.log(str)
    }).catch(function (err) {
        console.log("error showing info of the database");
        console.log(err);
    });
}

// This function syncs the local database with the remote database.
// Afterwards, the local document within the local database is updated to keep up with the remote update sequence number.
function syncDB(db, dbname) {
    var remotedb = new PouchDB(_database_domain+'/'+dbname); // We fetch here the remote database
    // Now we replicate the content from the remote database to the local database in order to ensure the same data is in both databases.
    db.replicate.from(remotedb).on('change', function (info) {
        console.log("[replicating...] on change:");
        console.log(info);
    }).on('paused', function (err) {
        console.log("[replicating...] on paused:");
        console.log(err);
        console.log("(the user might have gone offline)");
    }).on('active', function () {
        console.log("[replicating...] on active");
        console.log("(the user went back online)");
    }).on('denied', function (err) {
        console.log("[replicating...] on denied:");
        console.log(err);
        console.log("(a document might have failed to replicate due to permissions)");
    }).on('complete', function (info) {
        console.log("Replication from remote database to local '"+dbname+"' database successfully DONE!");
        updateLocalDocument(db, info.last_seq); // 'info.last_seq' corresponds to the 'update_seq' of the remote database, this way we can track the changes done in the local database.
        if (dbname == _roomsdb_name && _firstTime == true) {requestMapImages(0, requestMapImages, null); _firstTime = false;}
    }).on('error', function (err) {
        console.log("[replicating...] ("+dbname+") on error");
        console.log(err);
    });
}

// This function checks for changes in the local database.
// It compares the 'update_seq' of the remote database with the 'sequence_number_version' of the local document of the local database.
// 'alias' corresponds to "staff" for example, and 'dbname' corresponds to "staffdb" (the real database name)
function checkChanges(db, dbalias, dbname) {
    $.ajax({type:"GET", url: _server_domain+'/'+dbalias+'/version'+'?auth=admin', success: function(result){
        db.get('_local/sequence_number_version').then(function (result2) {
            console.log("sequence_number_version ["+dbalias+"] (local)="+result2.seq_version);
            console.log("update_seq ["+dbalias+"] (remote)="+result);
            if (result2.seq_version < result) {syncDB(db, dbname);} // If the local sequence number is smaller than the 'update_seq' in the server, we sync databases.
        }).catch(function (err) {
            console.log("WARNING: .local 'sequence_number_version' document doesn't exist:");
            console.log(err);
        });
    }, error: function(xhr,status,error) {console.log("error in 'checkChanges', AJAX call");console.log(error +":"+status);}});
}

// This function checks for changes in the local database corresponding to maps' images.
// 'alias' corresponds to "staff" for example, and 'dbname' corresponds to "staffdb" (the real database name)
function checkMapChanges(floor, dbalias, callback) {
    $.ajax({type:"GET", url: _server_domain+'/'+dbalias+'/mapversion/'+floor+'?auth=admin', success: function(result){
        setTimeout(function() {
            _dbrooms.get("map"+floor.toString()).then(function (result2) {
                console.log("map version [floor "+floor+"] (local)="+result2.v);
                console.log("map version [floor "+floor+"] (remote)="+result);
                if (result2.v < result) {requestMapImages(floor, null, result);}
                if (floor < 5) {callback(++floor, dbalias, checkMapChanges);} else {checkChanges(_dbrooms, dbalias, _roomsdb_name);} // We call recursively once again. Watch out! "CheckChanges"
                                                                                                                                    // is called now because otherwise, if it was called in "createDB"
                                                                                                                                    // function the local rooms database tended to be updated
                                                                                                                                    // before the map images were able to be updated first.
            }).catch(function (err) {
                console.log("error retrieving 'map.version' (local)");
                console.log(err);
            });
        },0);
    }, error: function(xhr,status,error) {console.log("error in 'checkMapChanges', AJAX call");console.log(error +":"+status);}});
}

// This function creates a local document which is a metadata document.
// This document stores the sequence number (number of changes made in the database) of the database after loading the initial data.
// This sequence number is used as a version number of the database, pretty much the same as the vanilla "update_seq".
// This local document and the sequence number is only stored in local databases, not in remote databases. The latter ones have their own "update_seq".
// The problem is that when replication is done, the local database doesn't track the changes done by replicate which doesn't update "update_seq" number either.
function createLocalDocument(db) {
    db.info().then(function (result) {
        db.put({
            _id: '_local/sequence_number_version',
            seq_version: result.doc_count
        }).then(function (response) {
            console.log("'_local/sequence_number_version' document created.");
        });
    }).catch(function (err) {
        console.log("error retrieving info of the database when creating local document");
        console.log(err);
    });
}

// This function updates the local sequence number of the local database.
// This function is called from two parts of the code: "syncDB" and "saveMapImage". In the former scenario, there is no need to look
// at the new sequence number. However, in the latter case, there is no way of knowing the new sequence number rather than checking it
// in the local database and add 1 to that number.
function updateLocalDocument(db, new_seq) {
    // if (new_seq != null) { // Este codigo comentado y el de la parte de abajo es para evitar que rooms.js se actualice solo cuando hay que actualizar un mapa. No esta acabado del todo. Falta evitar que se ejecute cuando la app se inicia por primera vez.
        db.get('_local/sequence_number_version').then(function (result) {
            db.put({
                _id: '_local/sequence_number_version',
                _rev: result._rev,
                seq_version: new_seq
            }).then(function (response) {
                console.log("'_local/sequence_number_version' corrently updated.");
                showToolTip("ready");
            });
        }).catch(function (err) {
            console.log("WARNING: .local 'sequence_number_version' document doesn't exist:");
            console.log(err);
        });
    // } else {
    //     // This 'else' corresponds to the call from 'saveMapImage' function where we don't know the new sequence number.
    //     // The only thing we know is that it has increased in one unit.
    //     db.info().then(function (result) {
    //         db.get('_local/sequence_number_version').then(function (result2) {
    //             db.put({
    //                 _id: '_local/sequence_number_version',
    //                 _rev: result2._rev,
    //                 seq_version: result.update_seq
    //             }).then(function (response) {
    //                 console.log("'_local/sequence_number_version' corrently updated for floor maps.");
    //             });
    //         }).catch(function (err) {
    //             console.log("WARNING: .local 'sequence_number_version' document doesn't exist:");
    //             console.log(err);
    //         });
    //     }).catch(function (err) {
    //         console.log("error showing info of the database");
    //         console.log(err);
    //     });
    // }
}

// This function recursively retrieves all floor images from the remote database starting from the floor given by the parameter.
// It is necessary to include also a version of the map which will be used later on to check whether the map is outdated or not.
function requestMapImages(floor, callback, new_version){
        console.log("Requesting map image #"+floor+" (floor)");
        var fimage = new XMLHttpRequest();
        fimage.open("GET", _server_domain+'/maps/'+_mapNames[floor], true); // 'true' means asynchronous
        // fimage.setRequestHeader("Content-Type","image/png"); // This is not necessary
        fimage.responseType = "arraybuffer"; // If we had used 'blob' it wouldn't have worked in Phonegap, I don't knnow why. There is no way to make Phonegap to understand Blob type if it is not with the plugin "blob-util"
        fimage.onreadystatechange = function () // once the request finished this function is executed
        // more info at: http://www.w3schools.com/Ajax/ajax_xmlhttprequest_onreadystatechange.asp
        {
            if(fimage.readyState == 4) // aqui tendria que añadir: ""&& fimage.status == 200", pero en el browser del Atom no funciona
            {
                // var response = new Blob([fimage.response], {type: "image/png"}); // This doesn't work on Phonegap, but it does in Desktop browsers.
                var blob = blobUtil.createBlob([fimage.response], {type: 'image/jpeg'}); // We convert the read image into blob
                blobUtil.blobToBase64String(blob).then(function (base64String) { // We convert the blob into base64
                    console.log(base64String);
                    saveMapImage(floor.toString(), base64String, new_version); // Now we save the image in the local database as a base64 string
                    if (floor < (_mapNames.length -1) && callback != null) {callback(++floor, requestMapImages);} // We call recursively once again until we finish retrieving all floor maps from remote database.
                }).catch(function (err) {
                    console.log("error converting from blob to base64");
                    console.log(err);
                });
                //More info about storing and reading Blob type images, XMLHttpRequest, storing any kind of file and blob-util plugin github page:
                //blob-util github page: https://github.com/nolanlawson/blob-util#blobToBinaryString
                // http://bl.ocks.org/nolanlawson/edaf09b84185418a55d9 (storing and reading Blob type images)
                // https://hacks.mozilla.org/2012/02/saving-images-and-files-in-localstorage/ (storing any kind of file)
                // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest (XMLHttpRequest)
                // https://msdn.microsoft.com/en-us/library/windows/apps/hh871381.aspx (requesting an image from a server using responseType)
            }
        }
        fimage.send(null);
        // More info about XMLhttprequest at: http://www.w3schools.com/ajax/ajax_xmlhttprequest_send.asp
}

// This function saves the image as base64 string in the local database.
// Map images are saved separated from the information of each floor in the database. The document contains an image field where the image is saved as a string.
// The images are not saved as attachements!
// It is necessary to include also a version of the map which will be used later on to check whether the map is outdated or not.
function saveMapImage(floor, base64, new_version) {
    _dbrooms.get("map"+floor).then(function (doc) {
        var ver;
        if (new_version != null) {ver = new_version; } else {ver = doc.v;}
        _dbrooms.put({
            _id: doc._id,
            _rev: doc._rev,
            image: base64,
            v: ver
        }).then(function (response) {
            console.log("Floor map image inserted SUCCESSFULLY! #"+floor+"");
            // updateLocalDocument(_dbrooms, null); // We must update the local document to prevent unnecesary updates and syncs from remote DB. // Este codigo comentado es para evitar que rooms.js se actualice solo cuando hay que actualizar un mapa. No esta acabado del todo. Falta evitar que se ejecute cuando la app se inicia por primera vez.
        }).catch(function (err) {
            console.log("error saving the image in the local database");
            console.log(err);
        });
    }).catch(function (err) {
        console.log("error getting floor");
        console.log(err);
    });
}

// This function retrieves a person or several persons based on the given name from the database
function retrievePerson(name) {
    _db.allDocs({
        include_docs: true
        // attachments: true // This is not used for the moment
    }).then(function (result) {
        // handle result
        _searched_people = [];
        for (i = 0; i < result.total_rows; i++) {
            if (result.rows[i].doc._id.indexOf(name) > -1) {
                _searched_people.push(result.rows[i].doc); // Inserting people found with the query
            }
        }
        console.log(_searched_people);
        showBothStaffNRooms(); // displays all people and/or rooms found with the query
    }).catch(function (err) {
        console.log(err);
    });
}

// This function retrieves a room or several rooms based on the given number.
// The boolean controls whether to show the results or not. This is done like that because when the searching item contains a number
// retrieveRoom is exclusively executed, but if the searching item doesn't contain a number retrieveStaff is executed first and
// is responsible of showing the corresponding results.
function retrieveRoom(room, bool) {
    _dbrooms.allDocs({
        include_docs: true,
        startkey: '0', // We are including startkey and endkey so that we skip the floor documents which are not part of the search.
        endkey:'5' // We are including startkey and endkey so that we skip the floor documents which are not part of the search.
    }).then(function (result) {
        // handle result
        _searched_rooms = [];
        for (i = 0; i < result.rows.length; i++) {
            var keys = Object.getOwnPropertyNames(result.rows[i].doc.rooms); // It gets all the keys for all the objects. More info at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyNames
            // Now we iterate over all the '_ids' of the selected floor:
            for (j = 0; j<keys.length; j++) {
                // we check if the searching item matches any of the '_id's
                if (keys[j].indexOf(room) > -1) {
                    _searched_rooms.push([result.rows[i].doc.rooms[keys[j]], result.rows[i].doc._id]); // Inserting an array (in an array) composed by the object and the floor number ('_id' of the document). Rooms found with the query
                    continue; // we perform continue in order to skip the if statement below
                }
                // if the text introduced by the user has spaces, we split each word of the sentence and try to do the matching again
                if (room.indexOf(" ")) {
                    var words = room.split(" "); // split the sentence in separate words
                    var introduce = true; // boolean that controls whether we have eventually found a match (between the searching item and the content in the database)
                    // We iterate over all the split words:
                    for (l = 0; l<words.length; l++) {
                        // If there is at least one of the words that doesn't match the text of the '_id' of the database, then we break the loop:
                        if (!(keys[j].indexOf(words[l]) > -1)) {
                            introduce = false;
                            break; // we perform break so that it doesn't continue searching. We have what we needed!
                        } // END inside if
                    } // END inside for
                    // If 'introduce' is eventually true, then we insert it in the result:
                    if (introduce) {
                        _searched_rooms.push([result.rows[i].doc.rooms[keys[j]], result.rows[i].doc._id]); // Inserting an array (in an array) composed by the object and the floor number ('_id' of the document). Rooms found with the query
                    } // END if
                }
            }
        }
        console.log(_searched_rooms);
        // if the text introduced by the user contains digits, then it means that "retrieveStaff" has not been executed, hence
        // we have the responsibility of showing the list.
        if (bool) {
            showRoomsList(); // displays all rooms found with the query
        }
    }).catch(function (err) {
        console.log("error retrieving a room or several rooms from the database");
        console.log(err);
    });
}

// This function is part of an AJAX call that retrieves an image/map
function retrieveMap(floor) {
        _dbrooms.get("map"+floor).then(function (doc) {
            blobUtil.base64StringToBlob(doc.image).then(function (blob) {
                // success
                // console.log(blob);
                _reva = blobUtil.createObjectURL(blob);
                showMap();
            }).catch(function (err) {
                // error
                console.log("error converting from base64 to blob");
            });
        });
    // More info about storing and reading Blob type images, XMLHttpRequest, storing any kind of file and blob-util plugin github page:
    // blob-util github page: https://github.com/nolanlawson/blob-util#blobToBinaryString
    // http://bl.ocks.org/nolanlawson/edaf09b84185418a55d9 (storing and reading Blob type images)
    // https://hacks.mozilla.org/2012/02/saving-images-and-files-in-localstorage/ (storing any kind of file)
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest (XMLHttpRequest)
    // https://msdn.microsoft.com/en-us/library/windows/apps/hh871381.aspx (requesting an image from a server using responseType)
    // More info about XMLhttprequest at: http://www.w3schools.com/ajax/ajax_xmlhttprequest_send.asp
}

// This function retrieves thte information attached to a specific beacon from the database and assigns its coordinates to the corresponding global variables.
// Those global variables are used for trilateration.
function retrieveBeacon(instance, j) {
    _dbbeacons.get(instance).then(function(doc) {
            _beacon = doc;
            if (j == 0) {
                // This is the CLOSEST beacon
                _b1X = _beacon.x; _b1Y = _beacon.y;
                // console.log("(b1X:"+_b1X+",b1Y:"+_b1Y+")");
            } else if (j == 1) {
                // This is the SECOND closest beacon
                _b2X = _beacon.x;
                // console.log("(b2X:"+_b2X+")");
            } else if (j == 2) {
                // This is the FARTHEST beacon
                _b3X = _beacon.x; _b3Y = _beacon.y;
                // console.log("(b3X:"+_b3X+",b3Y:"+_b3Y+")");
            } // END if
        }).catch(function (err) {
            console.log("error retrieving beacon from the database");
            console.log(err);
        });
}

// TO DELETE: it's just for testing purposes
function getAttachment(floor){
    console.log("HOLA??? (floor= "+floor+")");
    _dbrooms.get("map"+floor.toString()).then(function (doc) {
        console.log(doc._id);
        console.log(doc._rev);
        console.log(doc.image);
        blobUtil.base64StringToBlob(doc.image).then(function (blob) {
            // successlog
            console.log(blob);
            var imagen = blobUtil.createObjectURL(blob);
            console.log(imagen);
            var mybody = document.getElementById("imgprueba");
            mybody.src=imagen;
        }).catch(function (err) {
            // error
        });
    });
}
