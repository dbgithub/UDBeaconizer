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
        updateLocalDocument(db, info.last_seq); // 'info.last_seq' corresponds to the 'update_seq' of the remote database
        if (dbname == _roomsdb_name && _firstTime == true) {requestMapImages(0, requestMapImages, null); _firstTime = false;}
    }).on('error', function (err) {
        console.log("[replicating...] on error");
        console.log(err);
    });
}

// This function checks for changes in the local database.
// It compares the 'update_seq' of the remote database with the 'sequence_number_version' of the local document of the local database.
// 'alias' corresponds to "staff" for example, and 'dbname' corresponds to "staffdb" (the real database name)
function checkChanges(db, dbalias, dbname) {
    $.ajax({type:"GET", url: _server_domain+'/'+dbalias+'/version'+'?auth=admin', success: function(result){
        db.get('_local/sequence_number_version').then(function (result2) {
            console.log("sequence_number_version (local)="+result2.seq_version);
            console.log("update_seq (remote)="+result);
            if (result2.seq_version < result) {syncDB(db, dbname);} // If the local sequence number is smaller than the 'update_seq' in the server, we sync databases.
        }).catch(function (err) {
            console.log("WARNING: .local 'sequence_number_version' document doesn't exist:");
            console.log(err);
        });
    }, error: function(xhr,status,error) {console.log(error +":"+status);}});
}

// This function checks for changes in the local database corresponding to maps' images.
// 'alias' corresponds to "staff" for example, and 'dbname' corresponds to "staffdb" (the real database name)
function checkMapChanges(floor, dbalias, callback) {
    $.ajax({type:"GET", url: _server_domain+'/'+dbalias+'/mapversion/'+floor+'?auth=admin', success: function(result){
        setTimeout(function() {
            _dbrooms.get("map"+floor.toString()).then(function (result2) {
                console.log("map version (local)="+result2.v);
                console.log("map version (remote)="+result);
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
    }, error: function(xhr,status,error) {console.log(error +":"+status);}});
}

// This function creates a local document which is a metadata document.
// This document stores the sequence number (number of changes over the database) of the database after loading the initial data.
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
        console.log("error retrieving info of the database");
        console.log(err);
    });
}

// This function updates the local sequence number of the local database.
function updateLocalDocument(db, new_seq) {
    db.get('_local/sequence_number_version').then(function (result) {
        db.put({
            _id: '_local/sequence_number_version',
            _rev: result._rev,
            seq_version: new_seq
        }).then(function (response) {
            console.log(response.seq_version);
            console.log("'_local/sequence_number_version' corrently updated.");
        });
    }).catch(function (err) {
        console.log("WARNING: .local 'sequence_number_version' document doesn't exist:");
        console.log(err);
    });
}

// This function recursively retrieves all floor images from the remote database starting from the floor given by the parameter.
// It is necessary to include also a version of the map which will be used later on to check whether the map is outdated or not.
function requestMapImages(floor, callback, new_version){
    var mapNames = ["0_planta_cero.jpg", "1_planta_uno.jpg", "2_planta_dos.jpg", "3_planta_tres.jpg", "4_planta_cuatro.jpg", "5_planta_cinco.jpg"];
        console.log("hello loop (k="+floor+")");
        var fimage = new XMLHttpRequest();
        fimage.open("GET", _server_domain+'/maps/'+mapNames[floor], true); // 'true' means asynchronous
        // fimage.setRequestHeader("Content-Type","image/png"); // This is not necessary
        fimage.responseType = "arraybuffer"; // If we had used 'blob' it wouldn't have worked in Phonegap, I don't knnow why. There is no way to make Phonegap to understand Blob type if it is not with the plugin "blob-util"
        fimage.onreadystatechange = function () // once the request finished this function is executed
        // more info at: http://www.w3schools.com/Ajax/ajax_xmlhttprequest_onreadystatechange.asp
        {
            if(fimage.readyState == 4) // aqui tendria que añadir: ""&& fimage.status == 200", pero en el browser del atom no funciona
            {
                // var response = fimage.response; // This doesn't work on Phonegap, but it does in Desktop browsers.
                // var response = new Blob([fimage.response], {type: "image/png"}); // This doesn't work on Phonegap, but it does in Desktop browsers.
                var blob = blobUtil.createBlob([fimage.response], {type: 'image/jpeg'}); // We convert the read image into blob
                blobUtil.blobToBase64String(blob).then(function (base64String) { // We convert the blob into base64
                    console.log(base64String);
                    saveMapImage(floor, base64String, new_version); // Now we save the image in the local database as a base64 string
                    if (floor < (mapNames.length -1) && callback != null) {callback(++floor, requestMapImages);} // We call recursively once again until we finish retrieving all floor maps from remote database.
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
}

// This function saves the image as base64 string in the local database in the corresponding field as it appears in rooms.json file.
// Map images are saved separated from the information of each floor in the database. The document contains an image field where the image is saved as a string.
// The images are not saved as attachements!
// It is necessary to include also a version of the map which will be used later on to check whether the map is outdated or not.
function saveMapImage(floor, base64, new_version) {
    _dbrooms.get("map"+floor.toString()).then(function (doc) {
        var ver;
        if (new_version != null) {ver = new_version; } else {ver = doc.v;}
        _dbrooms.put({
            _id: doc._id,
            _rev: doc._rev,
            image: base64,
            v: ver
        }).then(function (response) {
            console.log("Floor map image inserted SUCCESSFULLY! (floor"+floor+")");
        }).catch(function (err) {
            console.log(err);
        });
    }).catch(function (err) {
        console.log("error getting floor");
        console.log(err);
    });
}

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


// // TO DELETE?????? NOT USEFULL ANYMORE??????
// This function creates a '.local' document in the database in order to control whether the DBs changes or not.
// Afterwards, depending on the database given as the argument, we load the corresponding data in each database.
function createChangesLoadData(db) {
    setTimeout(function() {
        if (_reva === -404) {
            db.put({
                _id: '_local/changes',
                hasChanged: true
            }).then(function (response) {
                console.log("'_local/changes' corrently inserted. hasChanged=" + true);
            }).catch(function (err) {
                console.log("error in createChangesLoadData:");
                console.log(err);
            });
            if (db === _db) { // This is the staff database
                readTxtFile("stafflist.txt", loadStaffList); // We are passing 'loadStaffList' as a callback function to ensure synchronous operations.
                hasChanged(false, _db);
            } else if (db === _dbrooms) { // This is the rooms database
                readJsonFile("rooms.json", loadRooms); // We are passing 'loadRooms' as a callback function to ensure synchronous operations.
                // The maps/images are not saved in the database for the moment. They are retrieved with an AJAX call.
                hasChanged(false, _dbrooms);
            } else if (db === _dbbeacons) {
                readJsonFile("beacons.json", loadBeacons); // We are passing 'loadBeacons' as a callback function to ensure synchronous operations.
                hasChanged(false, _dbbeacons);
            }
        }
    }, 2000); // This amount of time avoid JavaScript to behave badly. If I don't set it like that, it starts skipping functions and not working well. The amoung might vary.
}

// Shows databse info
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

// // TO DELETE?????? NOT USEFULL ANYMORE??????
// This function checks whether there has been any change in the DB or not.
// This function changes the value of the state of the changes variable. The desired value is passed as an argument.
function hasChanged(change, db) {
    db.get('_local/changes').then(function (result) {
        if (change !== null) {
            db.put({
                _id: '_local/changes',
                _rev: result._rev,
                hasChanged: change
            }).then(function (response) {
                console.log("'_local/changes' corrently updated. hasChanged=" + change);
            });
        }
        _reva = result.hasChanged;
    }).catch(function (err) {
        console.log("WARNING: .local 'changes' document doesn't exist:");
        console.log(err);
        if (err.status === 404) {
            // not found
            _reva = -404; // returned variable
        }
    });
}

// TO DELETE?????? NOT USEFULL ANYMORE??????
// This function saves the staff data in the browser's database as JSON documents
function loadStaffList() {
    var temp;
    for (i = 0; i < _tuples.length; i++) {
        temp = _tuples[i].split("|");
        _db.put({
            _id: temp[0].toLowerCase(),
            name: temp[0],
            position: temp[1],
            faculty: temp[2],
            email: temp[3],
            extension: temp[4],
            phone: temp[5],
            fax: temp[6],
            office: temp[7],
            officehours: [
                {"start": "10:00", "end":"12:00"}, // This is an example, it should be removed and let teachers add it by themselves
                {"start": "16:00", "end":"18:00"} // This is an example, it should be removed and let teachers add it by themselves
            ],
            website: "www.example.deusto.es", // This is an example, it should be removed and let teachers add it by themselves
            linkedin: "www.linkedin.deusto.com", // This is an example, it should be removed and let teachers add it by themselves
            notes: "notes...", // This is an example, it should be removed and let teachers add it by themselves
            dtech: temp[8] // This is an example, it should be removed and let teachers add it by themselves
        }).then(function (response) {
            // console.log("Correctly added STAFF document: " + response.id);
        }).catch(function (err) {
            console.log("error loading staff list:");
            console.log(err);
        });
    }
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

// TO DELETE?????? NOT USEFULL ANYMORE??????
// This functions loads/saves the rooms document read from a file into the database
function loadRooms() {
    for (eachIndex in _jsondata) {
        _dbrooms.put(_jsondata[eachIndex]).then(function (response) {
            console.log("Correctly added JSON document:" + response.id);
        }).catch(function (err) {
            console.log("error adding json data:");
            console.log(err);
        });
    }
}

// This function is part of an AJAX call that retrieves an image/map
// 'showAsSecondFloor' is a boolean indicating whether to load the map/image just as a unique floor or as a second floor. This might occur if the user and the room are in different floors.
function retrieveMap(floor, showAsSecondFloor) {
    switch (floor) {
        case "0":
        readImageFile(["img/0_planta_cero.jpg"], showMap, showAsSecondFloor);
        break;
        case "1":
        readImageFile(["img/1_planta_uno.jpg"], showMap, showAsSecondFloor);
        break;
        case "2":
        readImageFile(["img/2_planta_dos.jpg"], showMap, showAsSecondFloor);
        break;
        case "3":
        readImageFile(["img/3_planta_tres.jpg"], showMap, showAsSecondFloor);
        break;
        case "4":
        readImageFile(["img/4_planta_cuatro.jpg"], showMap, showAsSecondFloor);
        break;
        case "5":
        readImageFile(["img/5_planta_cinco.jpg"], showMap, showAsSecondFloor);
        break;
        default:
        break;
    }
}

// TO DELETE?????? NOT USEFULL ANYMORE??????
// This function loads/saves the beacons document read from a file into the database
function loadBeacons() {
    for (eachIndex in _jsondata) {
        _dbbeacons.put(_jsondata[eachIndex]).then(function (response) {
            console.log("Correctly added JSON document:" + response.id);
        }).catch(function (err) {
            console.log("error adding json data:");
            console.log(err);
        });
    }
}

// This function retrieves a specific beacon from the database and assigns its coordinates to the corresponding global variables.
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


// CRUD operations with PouchDB. Testing purposes (to delete in the near future).
// function addTodo(text) {
//     var todo = {
//         _id: "doc",
//         title: text,
//         completed: false
//     };
//     _db.put(todo, function callback(err, result) {
//         if (!err) {
//             console.log('Successfully posted a todo!');
//             // hyper.log("TEXT:" + text);
//             console.log("TEXT:" + text);
//         } else
//         {
//             console.log("ERROR" + err);
//         }
//     });
// }
//
// function getTodo() {
//     _db.get("_design/view_splitID").then(function (doc) {
//         // handle doc
//         // hyper.log(doc.title);
//         console.log(doc);
//     }).catch(function (err) {
//         console.log(err);
//     });
// }
//
// function updateTodo() {
//     // Remember that whenever you want to update any field, you are basically putin another document
//     // into the database. The "update" occurs because you specify the revision number of the document
//     // you want to update. Therefore, in case you want to add/remove fields to the documents, you just
//     // add/remove them within the .put function and that's gonna be what it remains in the DB.
//     _db.get("doc").then(function(doc) {
//         return _db.put({
//             _id: "doc",
//             _rev: doc._rev,
//             title: "Let's Dance3",
//             completed: false,
//             format: "PDF",
//             time: "10:00"
//         });
//     }).then(function(response) {
//         // handle response
//         console.log("update successful");
//         console.log(doc.title + doc.completed + doc._id);
//     }).catch(function (err) {
//         console.log(err);
//     });
// }
//
// function deleteTodo() {
//     _db.get('doc').then(function(doc) {
//         return _db.remove(doc._id, doc._rev);
//     }).then(function (result) {
//         // handle result
//         console.log("Doc deleted!");
//     }).catch(function (err) {
//         console.log(err);
//     });
// }
// END - CRUD operations with PouchDB. Testing purposes.



// // This function saves the read images into dbrooms database as attachments
// function loadMaps() {
//     // Con este snippet de codigo funciona en Desktop a las mil maravillas, en Phonegap se atasca, se satura sobremanera.
//     // for (i in _maps) {
//     //     _dbrooms.putAttachment('floor'+i, 'attachment'+i, _maps[i], 'image/jpg').then(function (result) {
//     //         // handle result
//     //         console.log("Correctly added FLOOR:" + result.id);
//     //     }).catch(function (err) {
//     //         console.log("error loading floor in the database:");
//     //         console.log(err);
//     //     });
//     // }
//     // Con este snippet de codigo nos aseguramos de que los attachments se añadan syncronamente sin saturar la maquina y por tanto Phonegap no se atasca y funciona bien.
//     // Pero el tiempo de ejecucion y de recuperacion de imagees es excesivo dejando esta implementacion casi inutil. Mejor hacer AJAX (al servidor o local) cada vez que se solcite una imagen.
//     _dbrooms.putAttachment('floor'+0, 'attachment'+0, _maps[0], 'image/jpg').then(function (result) {
//             // handle result
//             console.log("Correctly added FLOOR:" + result.id);
//             _dbrooms.putAttachment('floor'+1, 'attachment'+1, _maps[1], 'image/jpg').then(function (result) {
//                     // handle result
//                     console.log("Correctly added FLOOR:" + result.id);
//                     _dbrooms.putAttachment('floor'+2, 'attachment'+2, _maps[2], 'image/jpg').then(function (result) {
//                             // handle result
//                             console.log("Correctly added FLOOR:" + result.id);
//                         }).catch(function (err) {
//                             console.log("error loading floor in the database:");
//                             console.log(err);
//                         });
//                 }).catch(function (err) {
//                     console.log("error loading floor in the database:");
//                     console.log(err);
//                 });
//         }).catch(function (err) {
//             console.log("error loading floor in the database:");
//             console.log(err);
//         });
// }

// // This functions retrieves a map/image according to the floor number given as an argument. The DOM element 'map' is also passed as an argument to shyncronously change the src attribute so that the image can be loaded.
// function retrieveMap(floor, DOMmap) {
//     _dbrooms.getAttachment('floor'+floor, 'attachment'+floor).then(function (blob) {
//         // It returns the data URL for the retrieved image:
//         DOMmap.src = blobUtil.createObjectURL(blob);
//         console.log("DOMmap src = "+ DOMmap.src);
//     }).catch(function (err) {
//         hyper.log("error retrieving specific floor from database:");
//         hyper.log(err);
//     });
// }

// This function creates design documents which are used for second indexers for queries against the database
// Once you have specified the design documents you can query based on them and retrieve the documents you want.
// More info at: https://pouchdb.com/2014/05/01/secondary-indexes-have-landed-in-pouchdb.html
// https://pouchdb.com/api.html#query_database
// https://pouchdb.com/guides/queries.html
// function createDesignDocuments() {
//     var ddoc = {
//         _id: '_design/view_splitID', // It must have the "_design" prefix to be recognizable
//         views: {
//             by_name: { // This is how the "view" is called. You will use this name to query afterwards.
//                 map: function (doc) {
//                     if (doc._id.indexOf(_filter) > -1) {
//                         emit(doc._id); // outputs the value with which the documents are going to be filtered
//                     }
//                     }.toString() // It's necessary to preparate the object for becoming valid JSON.
//                 }
//             }
//         };
//     // Now, we have to save the design documents:
//     _db.put(ddoc).then(function () {
//         // success!
//         console.log("success");
//     }).catch(function (err) {
//         console.log("Error saving design documents: " + err);
//         // error 409 = already exists
//     });
// }
