// Author: Matija Podravec, 2012.

if (!mpagespace.dd) mpagespace.dd = {};
else if (typeof mpagespace.dd != 'object')
  throw new Error('mpagespace.dd already exists and is not an object');

mpagespace.dd = {
  dragStart: function(event) {
    var doc = mpagespace.view.getDoc();
    event.dataTransfer.setData('text/plain', this.getAttribute('id')); 
    var feedbackEl = doc.createElement('img');  
    feedbackEl.setAttribute('src', 'chrome://mpagespace/skin/feedback.png');
    event.dataTransfer.setDragImage(feedbackEl, 19, 19);
    event.dataTransfer.effectAllowed = 'none';
    this.style.opacity = 0.3;
  },

  dragOver: function(event) {
    event.preventDefault();
    event.stopPropagation();

    var doc = mpagespace.view.getDoc();
    var placeholderEl = doc.getElementById('dd-placeholder'); 
    if (!placeholderEl) {
      placeholderEl = doc.createElement('div');  
      placeholderEl.setAttribute('id', 'dd-placeholder');
      placeholderEl.setAttribute('class', 'widget');
    }

    if (this.className.indexOf('column') != -1) {
      for (var n=this.lastChild; n; n=n.previousSibling) {
        if (n.className && n.className.indexOf('widget') != -1) {
          if (event.layerY > (n.offsetTop + n.offsetHeight)) {
            break;  
          } else {
            return;
          }
        }
      }
      this.appendChild(placeholderEl); 
      return;
    }

    if ((event.layerY + 1 - this.offsetTop) / this.offsetHeight < 0.5) {
      this.parentNode.insertBefore(placeholderEl, this);
    } else {
      if (this.nextSibling) {
        this.parentNode.insertBefore(placeholderEl, this.nextSibling);
      } else {
        this.parentNode.appendChild(placeholderEl);
      }
    }
    var el = doc.getElementById(event.dataTransfer.getData('text/plain')); 
    placeholderEl.style.height = el.offsetHeight + 'px';
    placeholderEl.style.display = 'block';
  },

  drop: function(event) {
    var doc = mpagespace.view.getDoc();
    var data = event.dataTransfer.getData('text/plain');
    var placeholderEl = doc.getElementById('dd-placeholder'); 
    var el = doc.getElementById(data);
    el.style.opacity = 1;
    placeholderEl.parentNode.replaceChild(el, placeholderEl);
    event.preventDefault();
    event.stopPropagation();
  }, 

  dragEnd: function(event) {
    var doc = mpagespace.view.getDoc();
    var placeholderEl = doc.getElementById('dd-placeholder'); 
    if (placeholderEl) {
      var data = event.dataTransfer.getData('text/plain');
      var el = doc.getElementById(data);
      var widget = mpagespace.model.getWidget(el.getAttribute('widget-id'));
      var refWidgetEl = placeholderEl.nextSibling;
      var refWidget = null;
      if (refWidgetEl && refWidgetEl.className.indexOf('widget') != -1) {
        refWidget = mpagespace.model.getWidget(refWidgetEl.getAttribute('widget-id')); 
      }
      var panelId = placeholderEl.parentNode.getAttribute('id').substr('panel-'.length);
      mpagespace.model.insertToPanel(widget, panelId, refWidget);
      placeholderEl.parentNode.removeChild(placeholderEl);
      el.style.opacity = 1; 
    }
    event.preventDefault();
    event.stopPropagation();
  }
}
