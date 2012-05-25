/**
Events:
'playerjoin':
   When a player joins the game, all other players are notified
   and the server records the player in the games
'playerready':
   When a player is ready this event is sent to the server,
   and then echoed to all the other players as well
'playerleft'
   When a player disconnects, they are removed from the game
   and all other players are notified
'starttimer':
   After all players in the game are ready, this event
   is sent out synch everybody and start their games

Mongo Objects:
game:
{'gameid': int,
 'name': string,
 'players: playerarray,
 'active': bool
}

playerarray:
{'name':string,
 'score':int,
 'status':string
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
    if( store == undefined )
        return;

    socket.on('playerjoin',
        function(gameobj) {
            console.log('Got Join ' + socket.handshake.sessionID);
            var gameid = gameobj['game'];
            var player = gameobj['player'];

            if( gameid in games ) {
                store.gameobj = gameobj;
                socket.emit('playerjoin', {'player': player, 'status': 'waiting'});
                socket.broadcast.emit('playerjoin', {'player': player, 'status': 'waiting'});
            }
        });

    socket.on('playerready',
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
                    socket.emit('playerready', gameobj);
                    socket.broadcast.emit('playerready', gameobj);
                }
            }
        });

    socket.on('disconnect',
        function() {
            // On the iPad, if it goes to sleep and then comes back,
            // we get a disconnect event without a session so our
            // store is undefined. I'm sure there is a better explanation
            // here, but this works for now.
            if( store == undefined )
                return;
            var gameobj = store.gameobj;
            if( gameobj == undefined )
                return;
            var gameid = gameobj['game'];

            if( gameid in games ) {
                console.log('Ready count: ' + games[gameid]);
                games[gameid]['waiting'] -= 1;
                if( games[gameid]['waiting'] == 0 ) {
                    console.log('Emitting start');
                    socket.emit('starttimer');
                    socket.broadcast.emit('starttimer');
                }

                // Pull the player from the DB
                db.collection('games')
                    .update({'_id': gameid},
                            {'$pull': {'players': gameobj['player']}},
                            {safe: true},
                            function(err, doc) {
                                if( err ) {
                                    return;
                                } else {
                                }
                            });
            }
            socket.broadcast.emit('playerleft', gameobj);
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
                            // Setup socket on new game
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
            var player = {'name': req.body.player, 'score': 0, 'status': 'waiting'};

            if( player['name'].length == 0 ) {
                res.send('No player specified', 400)
                return;
            }

            console.log('Adding ' + player['name'] + ' to ' + req.params.id);
            db.collection('games')
                .update({'_id': gameid},
                        {'$push': {'players': player}},
                        {safe: true},
                        function(err, doc) {
                            if( err ) {
                                res.send('Error in update: ' + err, 500);
                                return;
                            } else {
                                // We now have another player waiting
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
