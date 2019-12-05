mPage
=====

Simple dashboard-like feed reader ([Firefox add-on](https://addons.mozilla.org/en-US/firefox/addon/mpage/)).

Screenshots
-----------

Click to expand.

* **Default light theme:**  
  <kbd><img src="https://raw.github.com/mpod/mPage/master/screenshots/light-theme.png" width="400"/></kbd>

* **Default dark theme:**  
  <kbd><img src="https://raw.github.com/mpod/mPage/master/screenshots/dark-theme.png" width="400"/></kbd>

* **Random generated theme:**  
  <kbd><img src="https://raw.github.com/mpod/mPage/master/screenshots/random-theme.png" width="400"/></kbd>

* **Version for Firefox for Android:**      
  <kbd><img src="https://raw.github.com/mpod/mPage/master/screenshots/android.png" width="200"/></kbd> 

Instructions
------------

Open Firefox and load `about:debugging` in the URL bar. Click the `Load 
Temporary Add-on` button and select the `src/manifest.json` file within the 
directory of the mPage extension.

Permissions
-----------

Following permissions are requested: 

* `<all_urls>`: for downloading RSS feeds
* `storage`: for storing configuration in `mpage.extension.json` file
* `downloads`: for downloading exported OPML file
* `history`: for marking links as visited when page is open in reader mode
* `tabs`: for accessing URL of active tabs, needed in discovering of feeds

