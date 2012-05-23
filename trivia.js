/**
game:
{'gameid': int,
 'name': string,
 'players: playerarray,
 'active': bool
}

playerarray:
{'name':string,
 'score':int
}
*/

var mongo = require('mongodb');
var mongodb = mongo.Db;
var server = mongo.Server;
var db = new mongodb('twitter', new server('127.0.0.1', 27017, {}));
var BSON = mongo.BSONPure;
var express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app),
    userStore = new express.session.MemoryStore();
var Session = require('connect').middleware.session.Session;
var games = {};

var send = function(res) {
    return function(err, item) {
                res.send(item);
            }
}

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

var parseCookie = require('connect').utils.parseCookie;

io.set('authorization',
        function(data, accept) {
            if( data.headers.cookie ) {
                data.cookie = parseCookie(data.headers.cookie);
                data.sessionID = data.cookie['express.sid'];
                data.userStore = userStore;
                userStore.get(data.sessionID,
                            function(err, session) {
                                if( err || !session ) {
                                    accept('No session', false);
                                } else {
                                    data.session = new Session(data, session);
                                    accept(null, true);
                                }
                            });
            } else {
                return accept('No cookie!', false);
            }
            accept(null, true);
        });

function handleSocket(socket) {
    console.log('Handling connection for ' + socket.handshake.sessionID);
    var store = socket.handshake.session;

    socket.on('joinserver',
        function(gameobj) {
            console.log('Got Join ' + socket.handshake.sessionID);
            var gameid = gameobj['game'];
            var player = gameobj['player'];

            if( gameid in games ) {
                store.gameobj = gameobj;
                socket.broadcast.emit('join', {'player': player, 'status': 'waiting'});
            }
        });

    socket.on('ready',
        function(gameobj) {
            console.log('Got Ready ' + socket.handshake.sessionID);
            var gameobj = store.gameobj;

            var gameid = gameobj['game'];
            if( gameid in games ) {
                console.log('Ready count: ' + games[gameid]);
                games[gameid]['waiting'] -= 1;
                if( games[gameid]['waiting'] == 0 ) {
                    console.log('Emitting start');
                    socket.emit('starttimer');
                    socket.broadcast.emit('starttimer');
                } else {
                    console.log('Emitting ready');
                    socket.emit('gotready', gameobj);
                    socket.broadcast.emit('gotready', gameobj);
                }
            }
        });

    socket.on('disconnect',
        function() {
            var gameobj = store.gameobj;
            socket.broadcast.emit('left', gameobj);
        });
}

app.configure(function() {
    app.use(express.bodyParser());
    app.use(allowCrossDomain);
    app.use(express.cookieParser());
    app.use(express.session({store: userStore, 
                                secret: 'secret',
                                key: 'express.sid'}));
    app.use(express.static(__dirname + '/public'));
});
app.get('/test/:id',
        function(req, res) {
            console.log(req.params.id);
            res.header('Content-type: text/html;charset=utf8');
            res.end('<!DOCTYPE html><head><meta charset="utf-8"></head><body><p>'+req.params.id+'</p></body>');
        });
/*
app.get('/',
        function(req, res) {
            db.collection('twits')
                .find({},{text:1})
                .skip(Math.random()*10000)
                .limit(30)
                .toArray(send(res));
        });
*/
app.get('/games',
        function(req, res) {
            db.collection('games')
                .find({'active':false})
                .toArray(send(res));
        });

app.get('/games/:id',
        function(req, res) {
            var gameid = new BSON.ObjectID.createFromHexString(req.params.id);

            db.collection('games')
                .findOne({'_id': gameid}, send(res));
        });

app.post('/games/',
        function(req, res) {
            var name = req.body.name;

            if( name.length == 0 ) {
                res.send('No game name sent', 400);
                return;
            }

            var game = {'name': name,
                        'active': false,
                        'players': []};

            db.collection('games')
                .insert(game, {safe:true, raw: true},
                    function(err, doc) {
                        if( err ) {
                            res.send('Error in game creation: ' + err, 500);
                        } else {
                            console.log('/' + doc[0]['_id']);
                            var sock = io.of('/' + doc[0]['_id'])
                                            .on('connection', handleSocket);
                            var game = {'waiting':0,'socket':sock};
                            games[doc[0]['_id']] = game;
                            res.send('Success', 201);
                        }
                    });
        });

app.put('/games/:id',
        function(req, res) {
            var gameid = new BSON.ObjectID.createFromHexString(req.params.id);
            var player = {'name': req.body.player, 'score': 0};

            if( player['name'].length == 0 ) {
                res.send('No player specified', 400)
                return;
            }

            db.collection('games')
                .update({'_id': gameid},
                        {'$push': {'players': player}},
                        {safe: true},
                        function(err, doc) {
                            if( err ) {
                                res.send('Error in update: ' + err, 500);
                                return;
                            } else {
                                games[gameid]['waiting'] += 1;
                                res.send('Success', 200);
                            }
                        });
        });

db.open(function() {
    console.log('Creating sockets for inactive games');
    db.collection('games')
        .find({'active':false})
        .toArray(
            function(err, results) {
                for(i in results) {
                    var sock = io.of('/' + results[i]['_id'])
                                 .on('connection', handleSocket);
                    console.log('Adding ' + results[i]['_id']);
                    var game = {'waiting': 0, 'socket': sock};
                    games[results[i]['_id']] = game;
                }
            });
    });
app.listen(3000, '0.0.0.0');
