// Author: Matija Podravec, 2012-2013

if (!mpagespace.storage) mpagespace.storage = {};
else if (typeof mpagespace.storage != 'object')
  throw new Error('mpagespace.storage already exists and is not an object');

Components.utils.import("resource://gre/modules/FileUtils.jsm");  
Components.utils.import("resource://gre/modules/NetUtil.jsm");

mpagespace.storage = {
  storageFactory: function() {
    return new mpagespace.storage.json();
  }
}

mpagespace.storage.json = function() {
  this.file = FileUtils.getFile('ProfD', ['mpage.extension.json']);  
  this.backupFile = FileUtils.getFile('ProfD', ['mpage.extension.json.bak']);  
  this.data = null;
}

mpagespace.storage.json.prototype = {
  load: function() {
    var self = this;
    if (!this.file.exists()) {
        throw new Error('Configuration file does not exist.');
    }
    var channel = NetUtil.newChannel(this.file);  
    channel.contentType = "application/json";  
    NetUtil.asyncFetch(this.file, function(inputStream, status) {  
      if (!Components.isSuccessCode(status)) {  
        mpagespace.dump('storage.load: Error in storage loading.');
        throw new Error('Error in storage loading.');
      }  
  
      var text = NetUtil.readInputStreamToString(inputStream, inputStream.available(),
        {charset: 'UTF-8'});  

      try {
        self.data = JSON.parse(text);
      } catch (e) {
        self.data = {};
      }
      mpagespace.dump('storage.load: Done');
      
      mpagespace.observerService.notifyObservers(null, 'mpage-storage', 'data-loaded');  
    });  
  },

  save: function(data) {
    this.writeToFile(data);
  },

  close: function() {
    // nop
  },

  getData: function() {
    return this.data;
  },

  backup: function() {
    if (this.backupFile.exists()) {
      this.backupFile.remove(false);
      mpagespace.dump('storage.backup: Old backup file is deleted.');
    }
    if (this.file.exists())
      this.file.copyTo(null, this.backupFile.leafName); 
    mpagespace.dump('storage.backup: Done');
  },

  restore: function() {
    if (this.backupFile.exists()) 
      this.backupFile.copyTo(null, this.file.leafName);
    else
      mpagespace.dump('storage.restore: Backup file is missing.');

    mpagespace.dump('storage.restore: Done');
  },

  writeToFile: function(model, synchronous) {
    var ostream = FileUtils.openSafeFileOutputStream(this.file)  
    this.data = JSON.stringify(model);  
    this.backup();
    
    if (synchronous) {
      ostream.write(this.data, this.data.length);
      FileUtils.closeSafeFileOutputStream(ostream); 
    } else {
      mpagespace.unicodeConverter.charset = "UTF-8";  
      var istream = mpagespace.unicodeConverter.convertToInputStream(this.data);  
      NetUtil.asyncCopy(istream, ostream, function(status) {  
        if (!Components.isSuccessCode(status)) {  
          mpagespace.dump('Error in model saving.');
          return;  
        }  
        FileUtils.closeSafeFileOutputStream(ostream); 
        mpagespace.dump('storage.writeToFile: Done');
        mpagespace.observerService.notifyObservers(null, 'mpage-storage', 'data-saved');  
      });    
    }
  }
}


