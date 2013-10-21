var Office = {
  debug: 0,
  debugStatus: '', // is used if not ''

  // Light limit, 0-860 is ON, 860-1023 is OFF
  lightLimit: 860,
  // Basic
  titles: {
    'error': 'Oops',
    'open': 'Åpent',
    'closed': 'Lukket',
    'meeting': 'Møte',
  },
  // Foods
  foods: {
    'waffle': {title: 'Vafler', icon: './img/icon-waffle.png'},
    'cake': {title: 'Kake', icon: './img/icon-cake.png'},
    'bun': {title: 'Boller', icon: './img/icon-bun.png'},
  },
  // Messages
  msgError: 'Klarte ikke hente kontorstatus',
  msgOpen: 'Gratis kaffe og te til alle!',
  msgClosed: 'Finn et komitemedlem for å åpne opp.',
  msgUntitledMeeting: 'Kontoret er opptatt', // titled events get names from calendar entries

  get: function(callback) {
    if (callback == undefined) {
      console.log('ERROR: Callback is required. In the callback you should insert the results into the DOM.');
      return;
    }

    if (this.debug && this.debugStatus != '') {
      callback(this.debugStatus, 'Debugging', 'Lolololol');
      return;
    }

    var self = this;
    this.getEventData( function(status, title, message) {
      if (status == 'open') {
        self.getLightData(callback);
      }
      else {
        // status: "closed"
        // title: "Lukket"
        // message: "Finn et komitemedlem for å åpne opp"
        if (self.debug) console.log('Office:\n- status is', status, '\n- title is', title, '\n- message is', message);
        callback(status, title, message);
      }
    });
  },

  getEventData: function(callback) {
    if (callback == undefined) {
      console.log('ERROR: Callback is required. In the callback you should insert the results into the DOM.');
      return;
    }

    var eventApi = Affiliation.org[localStorage.affiliationKey1].eventApi;
    
    // Receives info on current event from Onlines servers (without comments)
    // 1              // 0=closed, 1=meeting, 2=waffles, 3=error
    // Møte: dotKom   // event title or 'No title'-meeting or nothing
    var self = this;
    Ajaxer.getPlainText({
      url: eventApi,
      success: function(data) {
        var status = data.split('\n',2)[0];
        var title = data.split('\n',2)[1];

        // empty meeting title?
        if (title == '' && status == 1)
          title = self.msgUntitledMeeting;

        // set the status from fetched data
        switch(Number(status)) {

          // Old system (kept here for temporary backwards compatibility until
          // all the Notifiers out there are updated)
          
          case 0: callback('open', self.titles.open, self.msgOpen); break;
          case 1: callback('meeting', self.titles.meeting, title); break;
          case 2: callback('waffle', self.foods.waffle.title, title); break;
          case 3: callback('error', self.titles.error, self.msgError); break;

          // New system
          
          case 100: callback('error', self.titles.error, self.msgError); break;
          
          case 200: callback('open', self.titles.open, self.msgOpen); break;
          case 210: callback('meeting', self.titles.meeting, title); break;

          case 300: callback('waffle', self.foods.waffle.title, title); break;
          case 310: callback('cake', self.foods.cake.title, title); break;
          case 320: callback('bun', self.foods.bun.title, title); break;
          
          default: callback('error', self.titles.error, self.msgError);
        }
      },
      error: function(jqXHR, text, err) {
        if (self.debug) console.log('ERROR: Failed to get event data.');
        callback('error', self.titles.error, self.msgError);
      },
    });
  },

  getLightData: function(callback) {
    if (callback == undefined) {
      console.log('ERROR: Callback is required. In the callback you should insert the results into the DOM.');
      return;
    }

    var lightApi = Affiliation.org[localStorage.affiliationKey1].lightApi;

    // Receives current light intensity from the office: OFF 0-800-1023 ON
    var self = this;
    Ajaxer.getPlainText({
      url: lightApi,
      success: function(data) {
        if (data > self.lightLimit) {
          callback('closed', self.titles.closed, self.msgClosed);
        }
        else {
          callback('open', self.titles.open, self.msgOpen);
        }
      },
      error: function(jqXHR, err) {
        if (self.debug) console.log('ERROR: Failed to get light data.');
        callback('error', self.titles.error, self.msgError);
      },
    });
  },

}
