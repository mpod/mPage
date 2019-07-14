'use strict';

let Utils = {

  extend: function() {
    var dest = arguments[0] || {};
    var src, name, oldval, newval;

    for (var i=1; i<arguments.length; i++) {
      src = arguments[i];
      if (src == null) continue; 

      for (var name in src) {
        oldval = dest[name];  
        newval = src[name];

        if (dest === newval) continue;

        if (Array.isArray(newval)) {
          oldval = Array.isArray(oldval) ? oldval : [];
          dest[name] = Utils.extend(oldval, newval);
        } else if (typeof newval === 'object') {
          oldval = oldval && typeof oldval === 'object' ? oldval : {};
          dest[name] = Utils.extend(oldval, newval);
        } else {
          dest[name] = newval;
        }
      }
    }
    return dest;
  },

  translate: function(message, params) {
    if (lang[message])
      return lang[message];
    else
      return message;
  },

  map: function(array, callback) {
    var result = [];
    var value;

    if (!Array.isArray(array))
      throw new Error('main.map: argument is not an array.');

    for (var i=0; i<array.length; i++) {
      value = callback(array[i]);
      if (value != null)
        result.push(value);
    }
    return result;
  }

}

let lang = {
'loading.label': 'Loading...',
'widget.error.message': 'Error in feed loading. Try with disabled tracking protection.',
'ajaxException.title': 'Error',
'ajaxException.message': 'Unknown error happened.',
'invalidUrl.message': 'Invalid URL.',
'doNotAskAgain.label': "Don't ask again",

'welcome.message': 'Welcome to mPage!<br/><br/>To add a news feed it is enough to drag and drop a link to the page. Check out version for Firefox mobile as well.',

'close.label': 'Close',

'error.emptyName.title': 'Error',
'error.emptyName.message': 'Name cannot be an empty string.',

'addFeed.title': 'Add feed',
'addFeed.message': 'Paste a URL of the feed in the textbox.\n\nYou can always drag and drop a feed URL over mPage window.\n',

'addPage.title': 'Add page',
'addPage.message': 'Write a name of the new page.',
'addPage.error.message': 'Page with the same name already exists.',

'deletePage.title': 'Confirmation',
'deletePage.message': 'Do you really want to delete active page?',
'deletePage.error.message': "Can't delete the last page.",

'renamePage.title': 'Rename page',
'renamePage.message': 'Write a new name for active page.',
'renamePage.error.message': 'Page with the same name already exists.',

'resetConfirmation.title': 'Confirmation',
'resetConfirmation.message': 'Do you really want to reset plugin to default configuration?',

'widget.action.configure': 'Configure',
'widget.action.remove': 'Remove',
'widget.action.minimize': 'Minimize',
'widget.action.maximize': 'Maximize',

'toolbar.action.addfeed': 'Add feed',
'toolbar.action.addpage': 'Add page',
'toolbar.action.deletepage': 'Delete page',
'toolbar.action.renamepage': 'Rename page',
'toolbar.action.setstartpage': 'Set as start page',
'toolbar.action.options': 'Options',

'options.schemes.custom': 'Custom',
'options.schemes.default': 'Default',
'options.customcss.dialog.title': 'Choose CSS file',
'options.customcss.dialog.filetype': 'CSS files',

'subscribe.availableFeeds': 'More than one feed source has been found on the URL. Select one feed source and click Continue.',
'subscribe.availableFeeds.continue': 'Continue',
'subscribe.noAvailableFeeds': 'No feeds found on this URL.',
'subscribe.noFeedTitle': 'No title',

'options.export.error.nofile': 'Export failed - destination file is not selected.',
'options.export.processing': 'Processing...',
'converter.export.error': 'Failed!',
'converter.export.success': 'Done!',
'options.import.error.nofile': 'Import failed - source file is not selected.',
'options.import.processing': 'Processing...',
'converter.import.error': 'Failed!',
'converter.import.success': 'Done!',
'filePicker.export.title': 'Export to OPML file',
'filePicker.import.title': 'Import from OPML file',
'feedSetup.visitedFilterOverriden': 'Hide visited links. Currently overriden by global flag.'
}


