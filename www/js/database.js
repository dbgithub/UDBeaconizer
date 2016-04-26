    function addTodo(text) {
        var todo = {
            _id: "doc",
            title: text,
            completed: false
        };
        _db.put(todo, function callback(err, result) {
            if (!err) {
                console.log('Successfully posted a todo!');
                // hyper.log("TEXT:" + text);
                console.log("TEXT:" + text);
            } else
            {
                console.log("ERROR" + err);
            }
        });
    }

    function getTodo() {
        _db.get("_design/view_splitID").then(function (doc) {
            // handle doc
            // hyper.log(doc.title);
            console.log(doc);
        }).catch(function (err) {
            console.log(err);
        });
    }

    function updateTodo() {
        // Remember that whenever you want to update any field, you are basically putin another document
        // into the database. The "update" occurs because you specify the revision number of the document
        // you want to update. Therefore, in case you want to add/remove fields to the documents, you just
        // add/remove them within the .put function and that's gonna be what it remains in the DB.
        _db.get("doc").then(function(doc) {
            return _db.put({
                _id: "doc",
                _rev: doc._rev,
                title: "Let's Dance3",
                completed: false,
                format: "PDF",
                time: "10:00"
            });
        }).then(function(response) {
            // handle response
            console.log("update successful");
            console.log(doc.title + doc.completed + doc._id);
        }).catch(function (err) {
            console.log(err);
        });
    }

    function deleteTodo() {
        _db.get('doc').then(function(doc) {
            return _db.remove(doc._id, doc._rev);
        }).then(function (result) {
            // handle result
            console.log("Doc deleted!");
        }).catch(function (err) {
            console.log(err);
        });
    }

    function deleteDB() {
        if (_db.info().doc_count != 0) { // esto equivale a borrar la DB, es temporal hasta encontrar una mejor solucion
            _db.destroy().then(function (response) { // esto equivale a borrar la DB, es temporal hasta encontrar una mejor solucion
                // success
                console.log("Database deleted/removed successfully:");
            }).catch(function (err) { // esto equivale a borrar la DB, es temporal hasta encontrar una mejor solucion
                console.log(err); // esto equivale a borrar la DB, es temporal hasta encontrar una mejor solucion
            });
        }
    }

    // This function creates/fetches the database
    // There exists a local document that says whether there have been changes or not.
    function createDB(whichDB) {
        // We want to insert metadata information in the database as a '.local' document.
        // 'hasCHanged' is to check whether there have been changes in the DB or not.
        // First, we should check whether we are fetching the DB or creating for first time.
        if (whichDB === "staff") {
            _db = new PouchDB('staffdb');
            hasChanged(null, _db);
            createChangesLoadData(_db);
        } else {
            _dbrooms = new PouchDB('roomsdb');
            hasChanged(null, _dbrooms);
            createChangesLoadData(_dbrooms);
        }
    }

    // This function creates a local document changes in the database in order to control whether the DBs changes or not.
    // Afterwards, depending on the database given by the argument, we load the corresponding data in each database
    function createChangesLoadData(db) {
        setTimeout(function() {
            if (_reva === -404) {
                db.put({
                    _id: '_local/changes',
                    hasChanged: true
                }).then(function (response) {
                    console.log("Corrently inserted. hasChanged: " + response.hasChanged);
                }).catch(function (err) {
                    console.log("ERROR! CACA!: " + err);
                });
                if (db === _db) { // This is the staff database
                    readTxtFile("stafflist.txt", loadStaffList); // We are passing 'loadStaffList' as a callback function to ensure synchronous operations.
                    hasChanged(false, _db);
                } else { // This is the rooms database
                    readJsonFile("rooms.json", loadRooms); // We are passing 'loadRooms' as a callback function to ensure synchronous operations.
                    hasChanged(false, _dbrooms);
                }
            }
        }, 2000);
    }

    function DBinfo() {
        _db.info().then(function (result) {
            var str =
            "DB name: " + result.db_name + "\n" +
            "doc count: "+ result.doc_count + "\n" +
            "adapter: " + result.adapter + "\n" +
            "sqlite plugin: " + result.sqlite_plugin + "\n" +
            "websql encoding: " + result.websql_encoding;
            console.log(str)
        }).catch(function (err) {
            console.log(err);
        });
    }

    // This function checks whether there has been any change in the DB or not
    // This function changes the value of the state of the changes, passing the desired value as an argument
    function hasChanged(change, db) {
        db.get('_local/changes').then(function (result) {
            if (change !== null) {
                db.put({
                    _id: '_local/changes',
                    _rev: result._rev,
                    hasChanged: change
                }).then(function (response) {
                    console.log("Corrently updated. hasChanged: " + response.hasChanged);
                });
            }
            _reva = result.hasChanged;
        }).catch(function (err) {
            console.log(err);
            if (err.status === 404) {
                // not found
                _reva = -404; // returned variable
            }
        });
    }

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
                console.log("Correctly added. " + i + ":"+ response.id);
            }).catch(function (err) {
                console.log(err);
                console.log("error id="+err.id);
            });
        }
        console.log("i = " + i);
    }

    // This function retrieves a person or several persons based on the given name
    function retrievePerson(name) {
        _db.allDocs({
            include_docs: true,
            attachments: true // This is not used for the moment
        }).then(function (result) {
            // handle result
            console.log(_searched_people);
            _searched_people = [];
            console.log(_searched_people);
            for (i = 0; i < result.total_rows; i++) {
                if (result.rows[i].doc._id.indexOf(name) > -1) {
                    _searched_people.push(result.rows[i].doc); // Inserting people found with the query
                }
            }
            console.log(_searched_people);
            if (_searched_people.length == 0) { // If this happens, then it means that the user is looking for a place which has no number, e.g. cafe, lab, secretary office
                retrieveRoom(name) // In this case, 'name' is a place not a person (but without a number)
            } else {
                showStaffList(); // display all people found with the query
            }
        }).catch(function (err) {
            console.log(err);
        });
    }

    // This function retrieves a room or several rooms based on the given number
    function retrieveRoom(room) {
        _dbrooms.allDocs({
            include_docs: true,
            attachments: true // This is not used for the moment
        }).then(function (result) {
            // handle result
            _searched_rooms = [];
            for (i = 0; i < result.total_rows; i++) {
                var keys = Object.getOwnPropertyNames(result.rows[i].doc.rooms); // It gets all the keys for all the objects. More info at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyNames
                for (j = 0; j<keys.length; j++) {
                    if (keys[j].indexOf(room) > -1) {
                        _searched_rooms.push([result.rows[i].doc.rooms[keys[j]], result.rows[i].doc._id]); // Inserting an array (in an array) composed by the object and the floor number ('_id' of the document). Rooms found with the query
                    }
                }
            }
            console.log(_searched_rooms);
            showRoomsList(); // display all people found with the query
        }).catch(function (err) {
            console.log(err);
        });
    }

    function loadRooms() {
        for (eachIndex in _jsondata) {
            _dbrooms.put(_jsondata[eachIndex]).then(function (response) {
                console.log("Correctly added JSON document. = ");
                console.log(response);
            }).catch(function (err) {
                console.log(err);
                console.log("error id="+err.id);
            });
        }
    }

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
