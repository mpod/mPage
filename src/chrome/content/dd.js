// Author: Matija Podravec, 2012.

if (!mpagespace.dd) mpagespace.dd = {};
else if (typeof mpagespace.dd != 'object')
  throw new Error('mpagespace.dd already exists and is not an object');

mpagespace.dd = {
  dragStart: function(event) {
    var doc = mpagespace.view.getDoc();
    event.dataTransfer.setData('application/mpage-widget', this.getAttribute('id')); 
    event.dataTransfer.setDragImage(doc.getElementById('dd-feedback'), 19, 19);
    event.dataTransfer.effectAllowed = 'link';
    this.style.opacity = 0.3;
    event.stopPropagation();
  },

  dragOver: function(event) {
    if (!event.dataTransfer.types.contains('application/mpage-widget'))
      return;

    event.preventDefault();

    var doc = mpagespace.view.getDoc();
    var placeholderEl = doc.getElementById('dd-placeholder'); 
    if (!placeholderEl) {
      placeholderEl = doc.createElement('div');  
      placeholderEl.setAttribute('id', 'dd-placeholder');
      placeholderEl.setAttribute('class', 'widget');
    }

    if (this.className.indexOf('column') != -1) { 
      event.stopPropagation();
      var refEl = null;
      for (var n=this.lastChild; n; n=n.previousSibling) {
        if (n.nodeName.toLowerCase() == 'div' && n.className.indexOf('widget') != -1 
            && n.getAttribute('id') != 'dd-placeholder'){
          if ((event.layerY + 1 - n.offsetTop) / n.offsetHeight < 0.5) {
            refEl = n;
          } else
            break;
        }
      }
      if ((refEl == null && placeholderEl.getAttribute('refElId') != '') ||
          (refEl != null && placeholderEl.getAttribute('refElId') != refEl.getAttribute('id'))) {
        this.insertBefore(placeholderEl, refEl);
        var el = doc.getElementById(event.dataTransfer.getData('application/mpage-widget')); 
        placeholderEl.style.height = el.offsetHeight + 'px';
        placeholderEl.style.display = 'block';
        placeholderEl.setAttribute('refElId', refEl ? refEl.getAttribute('id') : '');
      }
      var wnd = doc.defaultView;
      if (wnd.scrollMaxY > wnd.scrollY && event.layerY - wnd.scrollY + 35 > wnd.innerHeight) {
        wnd.scrollBy(0, 10);
      } else if (wnd.scrollY > 0 && event.layerY - wnd.scrollY < 35) {
        wnd.scrollBy(0, -10);
      }
    }
  },

  drop: function(event) {
    var doc = mpagespace.view.getDoc(), data, el;

    if (event.dataTransfer.types.contains('text/plain') &&
        !event.dataTransfer.types.contains('application/mpage-widget')) {
      data = event.dataTransfer.getData('text/plain');
      el = doc.getElementById('subscribe-url');
      el.value = data;
      mpagespace.controller.subscribe();

      event.preventDefault();
      event.stopPropagation();

    } else if (event.dataTransfer.types.contains('application/mpage-widget')) {
      var placeholderEl = doc.getElementById('dd-placeholder'); 
      if (placeholderEl) {
        data = event.dataTransfer.getData('application/mpage-widget');
        el = doc.getElementById(data);
        var page = mpagespace.app.getModel().getPage();
        var widget = page.getWidget(el.getAttribute('widget-id'));
        var refWidgetEl = placeholderEl.nextSibling;
        var refWidget = null;
        if (refWidgetEl && refWidgetEl.className.indexOf('widget') != -1) {
          refWidget = page.getWidget(refWidgetEl.getAttribute('widget-id')); 
        }
        var panelId = placeholderEl.parentNode.getAttribute('id').substr('panel-'.length);
        if (refWidget == null || widget.id != refWidget.id) {
          page.removeFromPanel(widget);
          page.insertToPanel(widget, panelId, refWidget);
        }
        placeholderEl.parentNode.removeChild(placeholderEl);
        el.style.opacity = 1; 
      }

      event.preventDefault();
      event.stopPropagation();
    }
  }, 

  dragEnter: function(event) {
    if (!event.dataTransfer.types.contains('application/mpage-widget'))
      return;

    event.preventDefault();
    event.stopPropagation();
  },

  dragLeave: function(event) {
    if (!event.dataTransfer.types.contains('application/mpage-widget'))
      return;

    var doc = mpagespace.view.getDoc();
    var placeholderEl = doc.getElementById('dd-placeholder'); 
    var isDescendant = function(parentEl, childEl) {
      if (childEl == null)
        return false;
      else if (childEl.parentNode == parentEl)
        return true;
      else
        return isDescendant(parentEl, childEl.parentNode);
      
    };
    if (!isDescendant(this, event.relatedTarget))
      placeholderEl.parentNode.removeChild(placeholderEl);
    
    event.preventDefault();
    event.stopPropagation();
  },

  dragEnd: function(event) {
    var data = event.dataTransfer.getData('application/mpage-widget');
    var doc = mpagespace.view.getDoc();
    var el = doc.getElementById(data);
    el.style.opacity = 1; 
    event.preventDefault();
    event.stopPropagation();
  }
}
