// Author: Matija Podravec, 2012.

if (!mpagespace.feedSetup) mpagespace.feedSetup = {};
else if (typeof mpagespace.feedSetup != 'object')
  throw new Error('mpagespace.feedSetup already exists and is not an object');


mpagespace.feedSetup = {
  init: function() {
    var widget = window.arguments[0];
    var pages = window.arguments[1];
    var activePageId = window.arguments[2];
    
    document.getElementById('title').value = widget.title;
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
    
    var pagesMenu = document.getElementById('pages');
    pagesMenu.selectedIndex = -1;
    
    while (pagesMenu.firstChild != null)
      pagesMenu.removeChild(pagesMenu.firstChild);

    pagesMenu.appendChild(document.createElement('menupopup'));
    for (var i=0; i<pages.length; i++) {
      var el = document.createElement('menuitem');
      el.setAttribute('label', pages[i].title);
      el.setAttribute('value', pages[i].id);
      pagesMenu.firstChild.appendChild(el);
      if (pages[i].id == activePageId)
        pagesMenu.selectedIndex = i;
    }
  },  

  toggleDateFilter: function() {
    var filterCheckbox = document.getElementById('date-filter');
    var disabled = filterCheckbox.checked == false;

    for (el = filterCheckbox.nextSibling.firstChild; el; el = el.nextSibling) {
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
    result.config = config;
    result.pageId = document.getElementById('pages').value;
    result.accepted = true;
  },

  cancelDialog: function() {
    var result = window.arguments[3];

    result.accepted = false;
  }
}
