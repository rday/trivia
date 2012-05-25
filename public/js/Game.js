(function ($) {
  Game = Backbone.Model.extend({
    defaults: {
        gameid: null,
        name: null,
        players: [],
        active: false
    },
    initialize: function() {
        console.log('New Game Model');
    },
    sync: function(method, model, options) {
        if( method == 'GET' ) {
            $.get('/games/' + model['gameid'],
                function(data, status, xhr) {
                    console.log('Fetched game ' + model['gameid']);
                    console.log(data);
                    this.set(data);
                });
        }
    }
  });

  GameView = Backbone.View.extend({
    el: $("#game-modal"),
    initialize: function(options) {
        var that = this;
        this.game = options.game;
        console.log('Initializing game view for ' + this.game.get('name'));

        // Add player to this game's waiting list
        console.log('Adding ' + config.get('player'));
        $.ajax({
            url: '/games/' + this.game.get('_id'),
            data: {'player': config.get('player')},
            type: 'PUT',
            success: function(data, status, xhr) {
                // Namespace to the game in progress
                that.socket = io.connect('/' + that.game.get('_id'));

                // I'm starting to lose track of context here,
                // need to figure out how to keep 'this' pointing to
                // this.. err, that.
                that.socket.on('connect',
                    function() {
                        that.setupSocket(that.game);
                        // Tell the server we have joined the game
                        var gameobj = {'game': that.game.get('_id'),
                                       'player': config.get('player')};
                        that.socket.emit('playerjoin', gameobj);
                    });
                $(that.el).on('hidden',
                    function() {
                        that.socket.emit('playerleft');
                    });
                that.render();
                }
            });
    },
    events: {
        "click #ready-btn": "playerReady",
    },
    playerReady: function() {
        console.log('Logging ' + this.game.toJSON());
        this.socket.emit('playerready', this.game.toJSON());
    },
    setupSocket: function(game) {
        var socket = this.socket;
        console.log(this);
        console.log('Connected');

        socket.on('startgame',
            function(data) {
                console.log(data);
            });

        socket.on('starttimer',
            function() {
                tmrCountDown = setInterval(countDown, 1000);
            });

        // Whenever another player signals ready,
        // we are told.
        socket.on('playerready',
            function(gameobj) {
                console.log(gameobj);
                var player = gameobj['player'];

                $('#players').find('li').each(
                    function(i, e) {
                        console.log(e);
                        console.log($(e).data('player'));
                        if( $(e).data('player') == player ) {
                            $(e).html(player+': ready');
                        }
                    });
            });

        // If a player leaves we are told
        socket.of('playerleft',
            function(gameobj) {
                var player = gameobj['player'];

                $('#players').find('li').each(
                    function(i, e) {
                        if( $(e).data('player') == player ) {
                            $(e).remove();
                        }
                    });
                console.log('Somebody left: ' + gameobj['player']);
            });

        // When a new player joins the game, we are told
        socket.on('playerjoin',
            function(player) {
                console.log('Player join: ');
                console.log(player);
                var item = $('<li>'+player['player']+
                            ':'+
                            player['status']+
                            '</li>');
                item.data('player', player['player']);
                item.appendTo($('#players'));
                console.log('Got join');
            });

    },
    render: function() {
        console.log(this.game);
        console.log(this.game.toJSON());
        $(this.el).find('.modal-header h3')
                  .html(this.game.get('name'));
        $.each(this.game.get('players'),
            function(i, v) {
                console.log(v);
                var li = $("<li>" + v.name + ": " + v.status + "</li>");
                li.appendTo($('#players'));
            });
        $(this.el).modal('show');
    }
  });

  GamesCollection = Backbone.Collection.extend({
    initialize: function(models, options) {
    },
    model: Game,
  });

  GamesCollectionView = Backbone.View.extend({
    el: $("#games"),
    initialize: function() {
        // When the collection is updated, re-render
        // in the correct context
        _(this).bindAll('render');
        this.collection.bind('add', this.render);
        $("#game-list").html('');
        this.render();
    },
    add: function() {
        console.log('wtf');
        console.log(this);
    },
    render: function() {
        $("#game-list").html('');
        this.collection.each(
            function(game) {
                var li = $("<li>" + game.get("name") + "</li>");
                li.click(function() {
                    console.log('Launching ' + game.get('name'));
                    var view = new GameView({game: game});
                });
                $("#game-list").append(li);
            });
    }
  });

})(jQuery);
