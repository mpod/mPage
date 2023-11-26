'use strict';

let Feed = function(data, page) {
  this.url = data.url;
  this.title = data.title;
  this.id = data.widgetId;
  this.panelId = data.panelId;
  this.entriesToShow = data.entriesToShow ? data.entriesToShow : 10;
  this.hoursFilter = data.hoursFilter ? data.hoursFilter : 0;
  this.minimized = data.minimized ? true : false;
  this.visitedFilter = data.visitedFilter ? true : false;
  this.useGuid = data.useGuid ? true : false;
  this.groupByDate = data.groupByDate ? true : false;
  this.entries = [];
  this.availableFeeds = data.availableFeeds ? data.availableFeeds : [];
  this.errorMessage = null;
  this.feedsExtracted = false;
  this.page = page;
  this.model = page.model;
  this.state = 'BLANK';  // possible values: BLANK, LOADED, LOADING, ERROR
  this.dirty = false;
}

Feed.prototype = {
  getConfig: function() {
    return  {
      widgetId: this.id,
      panelId: this.panelId,
      title: this.title,
      url: this.url,
      availableFeeds: this.availableFeeds,
      hoursFilter: this.hoursFilter,
      visitedFilter: this.visitedFilter,
      useGuid: this.useGuid,
      groupByDate: this.groupByDate,
      entriesToShow: this.entriesToShow,
      minimized: this.minimized
    };      
  },

  isDirty: function() {
    return this.dirty == true;
  },

  isInitialized: function() {
    return ['LOADED', 'ERROR'].indexOf(this.state) != -1;
  },

  isInError: function() {
    return this.state == 'ERROR';
  },

  isInFeedSelectingState: function() {
    return this.state == 'LOADED' && this.availableFeeds.length > 0;
  },

  getErrorMessage: function() {
    if (this.isInError())
      if (this.errorMessage)
        return this.errorMessage;
      else
        return browser.i18n.getMessage('widget.error.message');
    else
      return null;
  },

  set: function(property, value) {
    if (property == 'url') {
      var url1 = new URL(this.url);
      var url2 = null;
      try {
        url2 = new URL(value);
      } catch(e) {
        url2 = new URL(value, url1.origin.href);
      }
      this.url = url2.href;
      this.availableFeeds = [];
      this.title = null;
      this.setDirty();
      this.load();
    } else if (property == 'useGuid') {
      this.useGuid = value;
      this.load();
    } else {
      this[property] = value;
      this.setDirty();
    }
    window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'widget-changed:' + this.id + ':' + property}));
  },

  setBulk: function(config) {
    var toLoad = false;
    var property;
    for (property in config){
      if (property == 'useGuid')
        toLoad = true;
      this[property] = config[property];
    }
    this.setDirty();
    if (toLoad) 
      this.load();
    else {
      window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'widget-changed:' + this.id}));
    }
  },

  setDirty: function() {
    this.dirty = true;
    this.page.setDirty();
  },

  getEntriesToShow: function() {
    var result = []
    var entry;
    var timeFilter = null;

    if (this.hoursFilter > 0) {
      if (this.hoursFilter % 24 == 0) {
        var now = new Date();
        var today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        timeFilter = today.setDate(today.getDate() - this.hoursFilter / 24 + 1);
      } else  
        timeFilter = (new Date()).getTime() - this.hoursFilter * 60 * 60 * 1000;
    }

    for (var i=0; i<this.entries.length; i++) {
      entry = this.entries[i];

      if (timeFilter && entry.date < timeFilter) 
        continue;

      result.push(entry);
      if (result.length >= this.entriesToShow)
        break;
    }

    return result;
  },

  startVisitedFilterTimer: function() {
    var globalVisitedFilter = mPage.getModel().getPreferences().globalVisitedFilter;
    if (!globalVisitedFilter && !this.visitedFilter)
      return;

    var self = this;

    var timerCallback = {
      notify: function() {
        window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'widget-changed:' + self.id}));
        console.log('feed.startVisitedFilterTimer: timer triggered for widget ' + self.id + '.');
      }
    };

    if (this.visitedFilterTimer)
      this.visitedFilterTimer.cancel();
    this.visitedFilterTimer = Components.classes["@mozilla.org/timer;1"]
                          .createInstance(Components.interfaces.nsITimer);
    this.visitedFilterTimer.initWithCallback(timerCallback, 1000, this.visitedFilterTimer.TYPE_ONE_SHOT);
  },

  releaseMemory: function() {
    this.entries = [];
    this.state = 'BLANK';
  },

  load: function() {
    var self = this;

    var errorHandler = function() {
        self.state = 'ERROR';
        window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'widget-loaded:' + self.id}));
        console.log('feed.load: ajax error handler executed for widget ' + self.id + '.');
    }

    var processHandler = function(response) {
      try {
        self.entries = [];
        self.process(response);
        self.state = 'LOADED';
        window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'widget-loaded:' + self.id}));
      } catch (e) {
        console.log('feed.load: First level error on widget ' + self.id + ' - ' + e.message);
        try {
          self.extractFeeds(response);
          self.state = 'LOADED';
          window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'widget-loaded:' + self.id}));
        } catch (e) {
          console.log('feed.load: Second level error on widget ' + self.id + ' - ' + e.message);
          self.entries = [];
          self.state = 'ERROR';
          window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'widget-loaded:' + self.id}));
        }
      }
    }

    this.state = 'LOADING';
    this.errorMessage = null;

    const delay = function(timeout) { 
      return new Promise(resolve => setTimeout(resolve, timeout));
    }

    const fetchFeed = function() {
      return browser.runtime.sendMessage({cmd: 'fetch-feed', url: self.url});
    }

    const getResource = function(retryCount) {
      const timeouts = [0, 100, 500, 1000, 2000, 3000];
      return fetchFeed().catch(function(error) {
        if (retryCount >= timeouts.length) {
          return Promise.reject(error);
        } else {
          return delay(timeouts[retryCount]).then(() => getResource(retryCount + 1))
        }
      });
    }

    return getResource(0).then(processHandler, errorHandler);
  },

  extractFeeds: function(htmlText) {
    var index = 0;

    console.log('feed.extractFeeds: Started');
    if (this.feedsExtracted) {
			throw new Error('Feeds already extracted (recursion).');
    }

    this.feedsExtracted = true;
    this.availableFeeds = [];

    while ((index = htmlText.indexOf('<link', index)) != -1) {
      var endIndex = htmlText.indexOf('>', index);
      if (endIndex != -1) {
        var attributes = htmlText.substr(index, endIndex - index).match(/\w+\s*=\s*("[^"]*")|('[^']*')/ig);
        attributes = attributes || [];
        var title = browser.i18n.getMessage('subscribe.noFeedTitle'), href = '', type = '';
        for (var i=0; i<attributes.length; i++) {
          var splitIdx = attributes[i].indexOf('=');
          if (splitIdx == -1) continue;
          var attribute = [attributes[i].substr(0, splitIdx), attributes[i].substr(splitIdx + 1)];
          attribute[1] = attribute[1].trim().substr(1, attribute[1].length - 2);
          if (attribute[0].trim() == 'type') type = attribute[1];
          if (attribute[0].trim() == 'href') {
            try {
              href = this.prepareUri(attribute[1]).href;
            } catch (e) {
              continue;
            }
          }
          if (attribute[0].trim() == 'title') title = attribute[1];
        }
        var feedTypes = ['text/xml', 'application/rss+xml', 'application/atom+xml', 'application/xml', 'application/rdf+xml']; 
        if (feedTypes.indexOf(type) != -1) {
          this.availableFeeds.push({
            title: title,
            href: href
          });
        }
      }
      index++;
    }

    if (this.availableFeeds.length == 0) {
      this.errorMessage = browser.i18n.getMessage('subscribe.noAvailableFeeds');
			throw new Error('No feeds found in HTML.');
    } else if (this.availableFeeds.length == 1) {
      this.set('url', this.availableFeeds[0].href); 
    }
  },

  processNative: function(feedText) {
    console.log('feed.processNative: Started');
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
    var uri = ios.newURI(this.url, null, null);
    var feedProcessor = Components.classes["@mozilla.org/feed-processor;1"]
                          .createInstance(Components.interfaces.nsIFeedProcessor);
    var self = this;

    feedProcessor.listener = {
      handleResult: function(result) {
        if (result.doc == null) {
          console.log('feed.processNative: Error on widget ' + self.id + '.');
          self.state = 'ERROR';
        } else {
          var feed = result.doc;
          feed.QueryInterface(Components.interfaces.nsIFeed);

          for (var i=0; i<feed.items.length; i++){
            try {
              var entry = feed.items.queryElementAt(i, Components.interfaces.nsIFeedEntry);
              self.entries.push({
                title: entry.title.text,
                link: entry.link,
                date: Date.parse(entry.published)
              });
            } catch (e) {
              // continue
            }
          }
          self.state = 'LOADED';
        }
        window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'widget-loaded:' + self.id}));
      }
    } 
    feedProcessor.parseFromString(feedText, uri);
  },

  prepareUri: function(uri) {
    var url = null;
    try {
      url = new URL(uri);
    } catch (e) {
      url = new URL('http://' + uri);
    }
    return url;
  },

  process: function(feedText) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(feedText, 'text/xml');

    var docEl = xmlDoc.documentElement;
    if (docEl.tagName == 'parsererror' && docEl.firstChild.data.indexOf('junk after document element') != -1) {
      var m = docEl.firstChild.data.match(/Line Number (\d+), Column (\d+)/);
      var line = parseInt(m[1]);
      var column = parseInt(m[2]);
      var allLines = feedText.split('\n');
      var validLines = allLines.slice(0, line -1);
      var lastLine = allLines[line - 1].substring(0, column - 1);
      validLines.push(lastLine);
      xmlDoc = parser.parseFromString(validLines.join('\n'), 'text/xml');
      docEl = xmlDoc.documentElement;
    }

    var nodes, node, entry, n;

    var isAtom = docEl.tagName == 'feed';
    var isRSS = docEl.tagName == 'rss';
    var isRdf = docEl.tagName == 'rdf:RDF';

    if (!isAtom && !isRSS && !isRdf) {
      throw new Error('Unsupported feed format.');
    }

    var getNodeValue = function(node) {
      var res = '';

      if (node) {
        node = node.firstChild;
      }
      while (node && res == '') {
        res = (node.nodeValue || '').trim();
        node = node.nextSibling;
      }
      return res;
    }

    var getElementsByTagName = function(xmlDoc, tagName) {
      var res = xmlDoc.getElementsByTagName(tagName);
      if (res.length == 0)
        res = xmlDoc.getElementsByTagName('rss:' + tagName);
      return res;
    }

    var channelEl = getElementsByTagName(xmlDoc, 'channel')[0];
    if (!channelEl) channelEl = xmlDoc;
    if (this.title == null) {
      this.title = getNodeValue(getElementsByTagName(channelEl, 'title')[0]);
      if (this.url.indexOf('reddit.com') != -1) {
        this.title += ' [reddit]';
      }
    }
    for (n = channelEl.firstChild; n; n = n.nextSibling){
      if (n.tagName && n.tagName.toLowerCase() == 'link') {
        this.siteUrl = getNodeValue(n);  
        break;
      } else if (n.tagName && n.tagName.toLowerCase() == 'rss:link') {
        this.siteUrl = getNodeValue(n);  
        break;
      }
    }
    var linkEl = getElementsByTagName(channelEl, 'link');
    if (linkEl) {
      if (linkEl[0] && linkEl[0].getAttribute('href'))
        this.siteUrl = linkEl[0].getAttribute('href');
      else if (linkEl[0] && linkEl[0].getAttribute('rss:href'))
        this.siteUrl = linkEl[0].getAttribute('rss:href');
      else if (linkEl[0]) 
        this.siteUrl = getNodeValue(linkEl[0]);
    }

    if (isRdf) { 
      nodes = getElementsByTagName(xmlDoc, 'item');
    } else if (isRSS) {
      nodes = channelEl.getElementsByTagName('item');
    } else {
      nodes = channelEl.getElementsByTagName('entry');
    }

    // Validate site url
    try {
      new URL(this.siteUrl);
    } catch (e) {
      this.siteUrl = null;
    }

    for (var i=0, count = nodes.length; i<count; i++){
      node = nodes[i];
      entry = {};
      entry.readed = false;

      for (var n = node.firstChild; n; n = n.nextSibling) {
        switch (n.tagName) {
          case 'title':
            if (!entry.title) entry.title = n.firstChild ? getNodeValue(n) : '';
            break;
          case 'rss:title':
            if (!entry.title) entry.title = n.firstChild ? getNodeValue(n) : '';
            break;
          case 'summary':
          case 'content:encoded':
            entry.content = n.firstChild ? getNodeValue(n) : '';
            break;
          case 'content':
          case 'rss:description':
          case 'description':
            if (!entry.content) {
              entry.content = n.firstChild ? getNodeValue(n) : '';
              if (this.url.indexOf('reddit.com') != -1) {
                var pattern = /<a href="([^"]*)">\[link\]</;
                var result = entry.content.match(pattern);
                if (result != null) {
                  entry.reddit = this.prepareUri(result[1]);
                }
              } 
            }
            break;
          case 'enclosure':
            if (n.getAttribute('type') && n.getAttribute('type').indexOf('image') == 0) 
              entry.image = n.getAttribute('url');
            break;
          case 'rss:link':
          case 'link':
            if (n.getAttribute('rel') == 'enclosure') {
              entry.image = n.getAttribute('href');
            } else {
              if (isAtom) {
                if (entry.link === void 0 || 
                    (n.getAttribute('rel') && n.getAttribute('rel') === 'alternate') ||
                    !n.getAttribute('rel'))
                  entry.link = this.prepareUri(n.getAttribute('href'));
              } else {
                entry.link = n.firstChild ? this.prepareUri(getNodeValue(n)) : null;
              }
            }
            break;
          case 'guid':
            if (this.useGuid) {
              entry.link = n.firstChild ? new URL(getNodeValue(n)) : entry.link;
            }
            break;
          case 'updated':
            entry.date = n.firstChild ? Date.parse(getNodeValue(n)) : null; 
            break;
          case 'modified':
          case 'pubDate':
          case 'dc:date':
            if (!entry.date) entry.date = n.firstChild ? Date.parse(getNodeValue(n)) : null; 
            break;
          case 'comments':
            if (n.firstChild)
              entry.comments = this.prepareUri(getNodeValue(n));
            break;
        }
      } 
      this.entries.push(entry);
    } 
  }
}
