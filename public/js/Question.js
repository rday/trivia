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
        this.finalscore = 0;
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
        var answer = e.currentTarget.innerText;
        this.finalscore = this.score;
        console.log('You chose ' + answer + ' at ' + this.finalscore);
        this.socket.emit('answer', e);
    },
    render: function() {
        var that = this;
        var question = this.questions[this.current++];
        var buttons = $(this.el).find('.modal-footer');
        buttons.html('');

        $(this.el).find('.modal-body')
                  .html('Please translate: ' + question['word']);
        $.each(question['choices'],
            function(i, v) {
                console.log(v);
                var btn = $('<a href="#" class="btn">' + v + '</a>');
                btn.appendTo(buttons);
            });
        $(this.el).modal('show');
        var progress = $('#timerbar').width() * .1;
        this.score = 1000;
        var tmr = setInterval(
                function() {
                    if( $('#timerbar').width() <= 0 ) {
                        clearInterval(tmr);
                        $(that.el).find('.modal-body')
                                  .html('You scored: ' + that.finalscore);
                    }
                    $('#timerbar').width($('#timerbar').width()-progress);
                    that.score -= 50;
                }, 500);
    }
  });

  QuestionsCollection = Backbone.Collection.extend({
    initialize: function(models, options) {
    },
    model: Question,
  });
})(jQuery);
