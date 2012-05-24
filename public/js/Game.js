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
        this.game = options.game;
        console.log('Initializing game view for ' + this.game.get('name'));
        this.render();
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
