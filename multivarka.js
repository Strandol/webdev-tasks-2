'use strict';

var MongoClient = require('mongodb').MongoClient;
var Promise = require('bluebird');
var url = 'mongodb://localhost:27017/test';
var request = null;

class Server {
    constructor () {
        this._url = null;
        this._query = {};
        this._collectionName = null;
        this._fieldName = null;
        this._newData = null;
        this._not = false;
    }

    server(url) {
        this._url = url;
        return this;
    };

    collection(name) {
        this._collectionName = name;
        return this;
    };

    where(fieldName) {
        this._fieldName = fieldName;
        this._query[fieldName] = {};
        return this;
    }

    equal(query) {
        this._not
            ? this.initQuery( { $not: { $eq: query } } )
            : this.initQuery( { $eq: query } );
        return this;
    };

    lessThan(query) {
        this._not
            ? this.initQuery( { $not: { $lt: query } } )
            : this.initQuery( { $lt: query } );
        return this;
    };

    greatThan(query) {
        this._not
            ? this.initQuery( { $not: { $gt: query } } )
            : this.initQuery( { $gt: query } );
        return this;
    }

    include(query) {
        this._not
            ? this.initQuery( { $not: { $in: query } } )
            : this.initQuery( { $in: query } );
        return this;
    };

    not() {
        this._not = true;
        return this;
    }

    set(field, value) {
        this._newData = {
            $set: {
                [field]: value
            }
        };
        return this;
    }

    initQuery(query) {
        this._query[this._fieldName] = query;
    }

    connect() {
        var context = this;
        return MongoClient.connect(this._url)
        .then(
            (db) => {
                return new Promise ((resolve, reject) => {
                    db.collection(
                        context._collectionName,
                        {strict: true},
                        (err, coll) => {
                            err
                                ? reject(err)
                                : resolve(coll);
                        }
                    );
                })
            },
            (err) => { throw new Error(err); }
        )
    }

    update(cb) {
        var context = this;
        this.connect()
            .then(
                (collection) => {
                return new Promise ((resolve, reject) => {
                    collection.updateMany(context._query, context._newData)
                    .then((data) => { resolve(data); },
                        (err) => { reject(err); } )
                })

                },
                (err) => { cb(err); }
            )
            .then(
                (result) => { console.log(result); },
                (err) => { console.log(err); }
            )
    }

    find(cb) {
        var context = this;
        this.connect()
            .then(
                (collection) => {
                    return new Promise ((resolve, reject) => {
                        collection.find(
                            context._query,
                            (err, data) => {
                                err
                                    ? reject(err)
                                    : resolve(data);
                            }
                        );
                    })
                },
                (err) => { cb(err); }
            )
            .then(
                (data) => {
                    return new Promise ((resolve) => {
                        data.toArray((err, docs) => {
                            resolve(docs);
                        })
                    })
                },
                (err) => { cb(err); }
            )
            .then(
                (docs) => { cb(null, docs); },
                (err) => { cb(err); }
            );
    }

    remove(cb) {
        this.connect()
            .then(
                (collection) => {
                    return new Promise ((resolve) => {
                        collection.remove()
                            .then((result) => {
                                resolve(result);
                            })
                    })
                },
                (err) => { cb(err); }
            )
            .then(
                (result) => { cb(null, result); },
                (err) => { cb(err); }
            )
    }

    insert(doc, cb) {
        this.connect()
            .then(
                (collection) => {
                    return new Promise ((resolve) => {
                        collection.insert(doc)
                            .then((result) => {
                                resolve(result);
                            })
                    })
                },
                (err) => { cb(err); }
            )
            .then(
                (result) => { cb(null, result); },
                (err) => { cb(err); }
            )
    }
}

module.exports = new Server();
