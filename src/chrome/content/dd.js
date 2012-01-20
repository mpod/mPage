if (!mpage.dd) mpage.dd = {};
else if (typeof mpage.dd != 'object')
  throw new Error('mpage.dd already exists and is not an object');

mpage.dd = {
  dragStart: function(event) {
    event.dataTransfer.setData('text/plain', this.getAttribute('id')); 
    var feedbackEl = document.createElementNS(mpage.view.htmlNS, 'img');  
    feedbackEl.setAttribute('src', 'chrome://mpage/skin/feedback.png');
    event.dataTransfer.setDragImage(feedbackEl, 19, 19);
    event.dataTransfer.effectAllowed = 'none';
    this.style.opacity = 0.3;
  },

  dragOver: function(event) {
    event.preventDefault();
    event.stopPropagation();

    var placeholderEl = document.getElementById('dd-placeholder'); 
    if (!placeholderEl) {
      placeholderEl = document.createElementNS(mpage.view.htmlNS, 'html:div');  
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
    var el = document.getElementById(event.dataTransfer.getData('text/plain')); 
    placeholderEl.style.height = el.offsetHeight + 'px';
    placeholderEl.style.display = 'block';
  },

  drop: function(event) {
    var data = event.dataTransfer.getData('text/plain');
    var placeholderEl = document.getElementById('dd-placeholder'); 
    var el = document.getElementById(data);
    el.style.opacity = 1;
    placeholderEl.parentNode.replaceChild(el, placeholderEl);
    event.preventDefault();
    event.stopPropagation();
  }, 

  dragEnd: function(event) {
    var placeholderEl = document.getElementById('dd-placeholder'); 
    if (placeholderEl) {
      var data = event.dataTransfer.getData('text/plain');
      var el = document.getElementById(data);
      var widget = mpage.model.getWidget(el.getAttribute('widget-id'));
      var refWidgetEl = placeholderEl.nextSibling;
      var refWidget = null;
      if (refWidgetEl && refWidgetEl.className.indexOf('widget') != -1) {
        refWidget = mpage.model.getWidget(refWidgetEl.getAttribute('widget-id')); 
      }
      var panelId = placeholderEl.parentNode.getAttribute('id').substr('panel-'.length);
      mpage.model.insertToPanel(widget, panelId, refWidget);
      placeholderEl.parentNode.removeChild(placeholderEl);
      el.style.opacity = 1; 
    }
    event.preventDefault();
    event.stopPropagation();
  }
}
