'use strict';

let Main = {
  version: '1.0.0'
};

(function() {
  browser.browserAction.onClicked.addListener(() => browser.tabs.create({url: '/mpage.xhtml'}));
})();
