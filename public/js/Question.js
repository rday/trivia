(function ($) {
  Question = Backbone.Model.extend({
    defaults: {
        word: null,
        choices: [],
        answer: 0,
    },
    initialize: function() {
        console.log('New Question Model');
    },
    sync: function(method, model, options) {
    }
  });

  QuestionView = Backbone.View.extend({
    el: $("#question-modal"),
    initialize: function(options) {
        var that = this;
        this.game = options.game;
        this.socket = options.socket;
        this.current = 0;
        this.questions = [{'word':'hola',
                           'choices':['hello','goodbye','peanut'],
                           'answer':0},
                          {'word':'ventana',
                           'choices':['door','wall','window'],
                           'answer':2},
                          {'word':'trabajar',
                           'choices':['to play','to work','to listen'],
                           'answer':2}];
        this.render();
    },
    events: {
        "click .btn": "answer",
    },
    answer: function(e) {
        console.log(e);
        this.socket.emit('answer', e);
    },
    render: function() {
        var question = this.questions[this.current++];
        var buttons = $(this.el).find('.modal-footer');
        buttons.html('');

        $(this.el).find('.modal-header h3')
                  .html('Translate');
        $.each(question['choices'],
            function(i, v) {
                console.log(v);
                var btn = $('<a href="#" class="btn">' + v + '</a>');
                btn.appendTo(buttons);
            });
        $(this.el).modal('show');
    }
  });

  QuestionsCollection = Backbone.Collection.extend({
    initialize: function(models, options) {
    },
    model: Question,
  });
})(jQuery);
