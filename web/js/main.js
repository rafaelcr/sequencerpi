// Sequencer class.
// Creates the sequencer button grid and adds all listeners and handlers
// necessary for communicating with the MIDI backend. All communications are
// done via AJAX TCP requests.
function Sequencer() {
  this._bpm = 120;
  this._matrixNotes = 16;
  this._matrixSteps = 16;
  this._buttonWidth = 40;
  this._buttonMargin = 10;
  this._socket = io.connect('http://localhost:8080');

  this.attachSocketHandlers();
};

Sequencer.prototype.attachSocketHandlers = function() {
  var ctx = this;
  // ACK established connection to build ALSA sequencer on the backend and
  // button grid on the frontend.
  this._socket.on('online', function(data) {
    ctx.buildSequencer();
    ctx._socket.emit('client_online', null);
  });
};

// Creates the button matrix using divs with absolute positioning.
Sequencer.prototype.buildSequencer = function() {
  // Don't build stuff again if it's already built, just clear notes, etc.
  if ($('#matrix').children().length > 0) {
    $('.button').removeClass('active');
    this.runHandler();
    return;
  }
  // Create buttons.
  for (var step = 0; step < this._matrixSteps; step++) {
    for (var note = 0; note < this._matrixNotes; note++) {
      var button = $('<div>&nbsp;</div>');

      // Style variations depending on column, position according to note
      // and step.
      button.addClass('button');
      if (step % 4 == 0) {  // Strong beat should be different style.
        button.addClass('strong');
      }
      if ($.inArray(note % 12, [1, 3, 6, 8, 10]) >= 0) {
        button.addClass('semitone');
      }
      var left = step * this._buttonWidth + step * this._buttonMargin;
      var bottom = note * this._buttonWidth + note * this._buttonMargin;
      button.css('width', this._buttonWidth + 'px');
      button.css('height', this._buttonWidth + 'px');
      button.css('left', left + 'px');
      button.css('bottom', bottom + 'px');

      // Data attributes need to be recorded for future use.
      button.attr('data-step', step);
      button.attr('data-note', note);
      $('#matrix').append(button);

      // Add listeners.
      button.click(this.buttonHandler);
    }
  }
  // Configure matrix container dimensions.
  var matrixHeight = this._matrixNotes * this._buttonWidth
      + (this._matrixNotes - 1) * this._buttonMargin;
  $('#matrix').css('height', matrixHeight);

  // Attach other action listeners.
  $('#run').click(this.runHandler);
};

// Button click handler. Sends the appropiate request to add or remove a
// MIDI note from the sequence in real time.
Sequencer.prototype.buttonHandler = function(event) {
  var note = $(this).attr('data-note');
  var step = $(this).attr('data-step');

  if (!$(this).hasClass('active')) {
    console.log("Adding note: " + note + " step: " + step);
    window.sequencer._socket.emit(
        'note_add', 
        { 'note': note, 'step': step });
  } else {
    console.log("Removing note: " + note + " step: " + step);
    window.sequencer._socket.emit(
        'note_remove', 
        { 'note': note, 'step': step });
  }
  $(this).toggleClass('active');
};

Sequencer.prototype.runHandler = function(event) {
  if (!$(this).hasClass('playing')) {
    console.log("Playing sequence.");
    window.sequencer._socket.emit('play', null);
    $(this).addClass('playing');
    $(this).html("STOP");
  } else {
    console.log("Stopping sequence.");
    window.sequencer._socket.emit('stop', null);
    $(this).removeClass('playing');
    $(this).html("PLAY");
  }
};

$(document).ready(function() {
  window.sequencer = new Sequencer();
});
