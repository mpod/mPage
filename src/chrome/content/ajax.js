// Author: Matija Podravec, 2012.

if (!mpagespace.ajax) mpagespace.ajax = {};
else if (typeof mpagespace.ajax != 'object')
  throw new Error('mpagespace.ajax already exists and is not an object');

mpagespace.ajax = {
  load: function(url, callback, options) {  
    var req = new XMLHttpRequest();  
    var n = 0;
    var timer;

    if (options.timeout) 
      timer = setTimeout(function() {
        req.abort();
        if (options.timeoutHandler) 
          options.timeoutHandler(url);
      }, options.timeout);

    req.onreadystatechange = function(event){
      if (req.readyState == 4) {
        if (timer) clearTimeout(timer);
        if (req.status == 200) {
          callback(req);
        } else {
          if (options.errorHandler) 
            options.errorHandler(req.status, req.statusText);
          else
            callback(null);
        }
      } else if (options.progressHandler) {
        options.progressHandler(++n);
      }
    };  

    var target = url;
    if (options.parameters)
      target += '?' + mpagespace.ajax.encodeFormData(options.parameters);

    try {
      req.open('GET', url);  
      req.send();
    } catch (e) {
      mpagespace.promptsService.alert(null, mpagespace.translate('ajaxException.title'), mpagespace.translate('ajaxException.message'));
      if (options.errorHandler) 
        options.errorHandler(null, null);
    } 
  },  

  encodeFormData: function(data) {
      var pairs = [];
      var regexp = /%20/g; // A regular expression to match an encoded space

      for(var name in data) {
          var value = data[name].toString();
          var pair = encodeURIComponent(name).replace(regexp,"+") + '=' +
              encodeURIComponent(value).replace(regexp,"+");
          pairs.push(pair);
      }

      return pairs.join('&');
  }
};
