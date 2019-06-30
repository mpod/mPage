mPage
=====

Simple dashboard-like feed reader (Firefox add-on).

### Themes

Themes are completely customizable. Here are screenshots of two default themes:

<img src="https://raw.githubusercontent.com/mpod/mPage/master/dark-theme.png"/>

<img src="https://raw.githubusercontent.com/mpod/mPage/master/light-theme.png"/>

### Instructions

Open Firefox and load about:debugging in the URL bar. Click the Load Temporary 
Add-on button and select the src/manifest.json file within the directory of the 
mPage extension.

### Permissions

Following permissions are requested: 

* <all_urls> - for downloading RSS feeds
* storage - for storing configuration in 'mpage.extension.json' file
* downloads - for downloading exported OPML file
* history - for marking links as visited when page is open in reader mode

