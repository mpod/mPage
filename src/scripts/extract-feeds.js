'use strict';

browser.runtime.onMessage.addListener(request => {
  if (request && request.cmd === "check-feeds") {
    var links = document.querySelectorAll('head link');
    var feedTypes = ['text/xml', 'application/rss+xml', 'application/atom+xml', 'application/xml', 'application/rdf+xml']; 

    var hasFeeds = false;
    links.forEach(function(link) {
      var linkType = link.getAttribute('type');
      hasFeeds = hasFeeds || feedTypes.indexOf(linkType) != -1;
    });

    var response = {
      hasFeeds: hasFeeds
    };
    return Promise.resolve(response);
  }
});
