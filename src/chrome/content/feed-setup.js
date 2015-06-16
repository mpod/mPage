// Author: Matija Podravec, 2012-2013

if (!mpagespace.feedSetup) mpagespace.feedSetup = {};
else if (typeof mpagespace.feedSetup != 'object')
  throw new Error('mpagespace.feedSetup already exists and is not an object');


mpagespace.feedSetup = {
  init: function() {
    var widget = window.arguments[0];
    var pages = window.arguments[1];
    var activePageId = window.arguments[2];
    
    document.getElementById('title').value = widget.title;
    document.getElementById('url').value = widget.url;
    document.getElementById('entries-to-show').value = widget.entriesToShow;

    if (widget.hoursFilter > 0) {
      document.getElementById('date-filter').checked = true;
      if (widget.hoursFilter % 24 == 0) {
        document.getElementById('date-filter-number').value = widget.hoursFilter / 24;
        document.getElementById('date-filter-type').value = 'days';
      } else {
        document.getElementById('date-filter-number').value = widget.hoursFilter;
        document.getElementById('date-filter-type').value = 'hours'
      } 
    } else {
      document.getElementById('date-filter').checked = false;
    }
    mpagespace.feedSetup.toggleDateFilter();

    var visitedFilterEl = document.getElementById('visited-filter');
    if (mpagespace.app.getModel().getPreferences().globalVisitedFilter) {
      visitedFilterEl.checked = true;
      visitedFilterEl.disabled = true;
      visitedFilterEl.label = mpagespace.translate('feedSetup.visitedFilterOverriden');
    } else {
      visitedFilterEl.checked = widget.visitedFilter;
    }
    document.getElementById('use-guid').checked = widget.useGuid;
  },  

  toggleDateFilter: function() {
    var filterCheckbox = document.getElementById('date-filter');
    var disabled = filterCheckbox.checked == false;

    for (var el = filterCheckbox.nextSibling.firstChild; el; el = el.nextSibling) {
      el.disabled = disabled;
    }
  },

  acceptDialog: function() {
    var result = window.arguments[3];
    var widget = window.arguments[0];
    var config = {};

    config.title = document.getElementById('title').value;
    config.entriesToShow = document.getElementById('entries-to-show').value;
    if (document.getElementById('date-filter').checked) {
      config.hoursFilter = document.getElementById('date-filter-number').value;
      if (document.getElementById('date-filter-type').value == 'days')
        config.hoursFilter = config.hoursFilter * 24;
    } else {
      config.hoursFilter = 0;
    }
    config.visitedFilter = document.getElementById('visited-filter').checked;
    config.useGuid = document.getElementById('use-guid').checked;

    result.config = config;
    result.accepted = true;
  },

  cancelDialog: function() {
    var result = window.arguments[3];

    result.accepted = false;
  }
}
