'use strict';

let Main = {
  version: '1.0.0'
};

/* Communication protocol:
 *
 * popup -> background 
 *   * 'add': triggers action of adding a feed to mpage
 *   * 'open': opens a mpage
 *
 * background -> content
 *   * 'check-feeds': asks active page does it contain any feeds
 *
 * background -> mpage
 *   * 'add': triggers an action of adding a feed to mpage, it contains url as a parameter
 */

browser.browserAction.onClicked.addListener(function() {
  browser.tabs.create({url: '/mpage.xhtml'});
});

function getActiveTab() {
  return browser.tabs.query({active: true, currentWindow: true});
}

function handleMessage(request, sender, sendResponse) {
  if (request && request.cmd === 'open') {
    browser.tabs.create({url: '/mpage.xhtml'});
  } else if (request && request.cmd === 'add') {
    var mPageUrl = browser.runtime.getURL('/mpage.xhtml');
    var mPageTab = browser
      .tabs
      .query({url: mPageUrl + '*', currentWindow: true})
      .then(function(tabs) {
        if (!tabs.length)
          return browser
            .tabs
            .create({url: '/mpage.xhtml'})
            .then(tab => new Promise(function(resolve, reject) {
              setTimeout(() => resolve(tab), 1000);
            }));
        else
          return browser.tabs.update(tabs[0].id, {active: true});
      });
    Promise
      .all([ mPageTab, getActiveTab() ])
      .then(function(result) {
        var mPageTab = result[0];
        var activeTab = result[1][0];
        var activeTabUrl = activeTab.url;
        browser.tabs.sendMessage(mPageTab.id, {cmd: 'add', url: activeTabUrl});
      });
  } 
}

browser.runtime.onMessage.addListener(handleMessage);

function updateWithAvailableFeeds(tabId, checkResult) {
  if (checkResult && checkResult.hasFeeds) {
    browser.browserAction.setBadgeText({text: '!'});
    browser.browserAction.setBadgeBackgroundColor({color: '#f15a22'});
    browser.browserAction.setPopup({popup: "/scripts/popup/popup.html"});
    if (browser.browserAction.setBadgeTextColor)
      browser.browserAction.setBadgeTextColor({color: 'white'});
  } else {
    browser.browserAction.setBadgeText({text: ''});
    browser.browserAction.setPopup({popup: ''});
  }
};

function checkFeeds(tabId) {
  browser.tabs
    .sendMessage(tabId, {cmd: 'check-feeds'})
    .then(response => {
      updateWithAvailableFeeds(tabId, response);
    })
    .catch(error => {
      updateWithAvailableFeeds(tabId, null);
    });
}

browser.tabs.onActivated.addListener(tab => checkFeeds(tab.tabId));

browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
  if (changeInfo.status === 'complete') checkFeeds(tabId)
});
