'use strict';

let DragAndDrop = {
  pageHandler: {
    prefixEl: 'page-',

    dragStart: function(event) {
      var prefix = DragAndDrop.pageHandler.prefixEl;
      var pageId = parseInt(event.currentTarget.getAttribute('id').substr(prefix.length));
      event.dataTransfer.setData('application/mpage-page', pageId); 
      event.stopPropagation();
    },

    dragOver: function(event) {
      var prefix = DragAndDrop.pageHandler.prefixEl;
      var doc = View.getDoc();
      var refEl = null;

      if (event.dataTransfer.types.indexOf('application/mpage-page') != -1) {
        var indicatorBarEl = doc.getElementById('nav-drop-indicator-bar'); 
        indicatorBarEl.style.display = 'block';
        for (var n=event.currentTarget.lastChild; n; n=n.previousSibling) {
          if (n.nodeName.toLowerCase() == 'li' && 
            n.getAttribute('id').indexOf(prefix) != -1) {
              if ((event.layerY + 1 - n.offsetTop) / n.offsetHeight < 0.5) {
                refEl = n;
              } else
                break;
          }
        }
        if (refEl != indicatorBarEl.nextSibling) {
          if (refEl == null)
            indicatorBarEl.style.top = (event.currentTarget.lastChild.offsetTop + event.currentTarget.lastChild.offsetHeight - 1) + 'px';
          else
            indicatorBarEl.style.top = (refEl.offsetTop - 1) + 'px';
          indicatorBarEl._mpagespace = {refEl: refEl};
        }

        event.preventDefault();
        event.stopPropagation();
      } else if (event.dataTransfer.types.indexOf('application/mpage-widget') != -1 ||
                 event.dataTransfer.types.indexOf('text/plain') != -1) {
        for (var n=event.currentTarget.lastChild; n; n=n.previousSibling) {
          if (n.nodeName.toLowerCase() == 'li' && 
            n.getAttribute('id').indexOf(prefix) != -1 &&
            event.layerY >= n.offsetTop &&
            event.layerY <= n.offsetTop + n.offsetHeight) {
              refEl = n;
              break;
          }
        }

        var pageId = parseInt(refEl.getAttribute('id').substr(prefix.length)); 
        var timerCallback = function() {
          mPage.getModel().changeActivePage(pageId);
        };
        if (event.currentTarget._mpagespace == null) {
          event.currentTarget._mpagespace = {}; 
        } 
        if (event.currentTarget._mpagespace.pageToOpen != pageId) {
          if (event.currentTarget._mpagespace.timer)
            window.clearTimeout(event.currentTarget._mpagespace.timer);
          var timer = window.setTimeout(timerCallback, 500);
          event.currentTarget._mpagespace.timer = timer;
          event.currentTarget._mpagespace.pageToOpen = pageId;
        }

        event.preventDefault();
        event.stopPropagation();
      }
    },

    drop: function(event) {
      if (event.dataTransfer.types.indexOf('application/mpage-page') != -1) {
        var prefix = DragAndDrop.pageHandler.prefixEl;
        var doc = View.getDoc();
        var pageId = event.dataTransfer.getData('application/mpage-page');
        var el = doc.getElementById(prefix + pageId);
        var indicatorBarEl = doc.getElementById('nav-drop-indicator-bar'); 
        var refEl = indicatorBarEl._mpagespace.refEl;
        indicatorBarEl.style.display = 'none';
        el.parentNode.insertBefore(el, refEl);
        if (refEl.className == 'first') {
          refEl.className = '';
          el.className = 'first';
        }
        
        var order = [];
        for (el = el.parentNode.firstChild; el && el.nodeName.toLowerCase() == 'li'; el = el.nextSibling) {
          pageId = parseInt(el.getAttribute('id').substr(prefix.length)); 
          if (isNaN(pageId) == false) 
            order.push(pageId);
        }
        mPage.getModel().setPageOrder(order);

        event.preventDefault();
        event.stopPropagation();
      }
    },

    dragEnter: function(event) {
      if (event.dataTransfer.types.indexOf('application/mpage-widget') != -1 ||
          event.dataTransfer.types.indexOf('text/plain') != -1) {
        event.preventDefault();
        event.stopPropagation();
      }
    },

    dragLeave: function(event) {
      if (event.dataTransfer.types.indexOf('application/mpage-widget') != -1 ||
          event.dataTransfer.types.indexOf('text/plain') != -1) {
        if (event.currentTarget._mpagespace && event.currentTarget._mpagespace.timer) {
          window.clearTimeout(event.currentTarget._mpagespace.timer); 
          event.currentTarget._mpagespace = null;
        }
        event.preventDefault();
        event.stopPropagation();
      } else if (event.dataTransfer.types.indexOf('application/mpage-page') != -1) {
        var doc = View.getDoc();
        var indicatorBarEl = doc.getElementById('nav-drop-indicator-bar'); 
        indicatorBarEl.style.display = 'none';

        event.preventDefault();
        event.stopPropagation();
      }
    },

    dragEnd: function(event) {
      if (event.dataTransfer.types.indexOf('application/mpage-page') != -1) {
        var doc = View.getDoc();
        var indicatorBarEl = doc.getElementById('nav-drop-indicator-bar'); 
        indicatorBarEl.style.display = 'none';

        event.preventDefault();
        event.stopPropagation();
      }
    }
  }, 

  widgetHandler: {
    prefixEl: 'widget-',

    dragStart: function(event) {
      var doc = View.getDoc();
      var prefix = DragAndDrop.widgetHandler.prefixEl;
      var widgetId = parseInt(event.currentTarget.getAttribute('id').substr(prefix.length));
      var el = doc.getElementById(prefix + widgetId);
      var feedConfigEl = el.querySelector('div.feedConfig');
      if (feedConfigEl && feedConfigEl.style.display == 'block') {
        event.preventDefault();
        return false;
      }

      event.dataTransfer.setData('application/mpage-widget', widgetId); 
      event.dataTransfer.setDragImage(doc.getElementById('dd-feedback'), 19, 19);
      event.dataTransfer.effectAllowed = 'move';
      event.currentTarget.style.opacity = 0.3;
      event.stopPropagation();
    },

    dragOver: function(event) {
      if (event.dataTransfer.types.indexOf('application/mpage-widget') != -1 || 
          event.dataTransfer.types.indexOf('text/plain') != -1) {
        var prefix = DragAndDrop.widgetHandler.prefixEl;
        var doc = View.getDoc();
        var placeholderEl = doc.getElementById('dd-placeholder'); 
        if (!placeholderEl) {
          placeholderEl = doc.createElement('div');  
          placeholderEl.setAttribute('id', 'dd-placeholder');
          placeholderEl.setAttribute('class', 'widget');
        }

        if (event.currentTarget.className.indexOf('column') != -1) { 
          var refEl = null;
          for (var n=event.currentTarget.lastChild; n; n=n.previousSibling) {
            if (n.nodeName.toLowerCase() == 'div' && n.className.indexOf('widget') != -1 
                && n.getAttribute('id') != 'dd-placeholder'){
              if ((event.layerY + 1 - n.offsetTop) / n.offsetHeight < 0.5) {
                refEl = n;
              } else
                break;
            }
          }
          var refEl = doc.elementFromPoint(event.clientX, event.clientY);
          while (refEl.className.indexOf('column') == -1 && refEl.className.indexOf('widget') == -1)
            refEl = refEl.parentNode;
          if (refEl.className.indexOf('column') != -1)
            refEl = null;

          if ((refEl == null && placeholderEl.getAttribute('refElId') != '') ||
              (refEl != null && placeholderEl.getAttribute('refElId') != refEl.getAttribute('id'))) {
            event.currentTarget.insertBefore(placeholderEl, refEl);
            var el = doc.getElementById(prefix + event.dataTransfer.getData('application/mpage-widget')); 
            var placeholderHeight = el ? el.offsetHeight : 150; 
            placeholderEl.style.height = placeholderHeight + 'px';
            placeholderEl.style.display = 'block';
            placeholderEl.setAttribute('refElId', refEl ? refEl.getAttribute('id') : '');
          }
        }

        event.preventDefault();
        event.stopPropagation();
      }
    },

    drop: function(event) {
      var doc = View.getDoc(), data, el, widget;

      if (event.dataTransfer.types.indexOf('application/mpage-widget') != -1 ||
          event.dataTransfer.types.indexOf('text/plain') != -1) {
        var placeholderEl = doc.getElementById('dd-placeholder'); 
        var prefix = DragAndDrop.widgetHandler.prefixEl;

        if (placeholderEl) {
          var model = mPage.getModel();
          var page = model.getPage();
          var refWidgetEl = placeholderEl.nextSibling;
          var refWidget = null;
          if (refWidgetEl && refWidgetEl.className.indexOf('widget') != -1) {
            refWidget = page.getWidget(refWidgetEl.getAttribute('widget-id')); 
          }
          var panelId = placeholderEl.parentNode.getAttribute('id').substr('panel-'.length);

          if (event.dataTransfer.types.indexOf('application/mpage-widget') != -1) {
            data = event.dataTransfer.getData('application/mpage-widget');
            widget = page.getWidget(data);
            if (widget == null) {
              widget = model.findWidget(data);
            }
            if (refWidget == null || widget.id != refWidget.id) {
              if (widget.page.id != page.id) {
                model.moveWidgetToPage(widget, page.id);
                widget.load();
              }
              page.moveWidget(widget, panelId, refWidget);
            }
          } else {
            data = event.dataTransfer.getData('text/plain');
            widget = mPage.getModel().getPage().createAndAddWidget(data, panelId, refWidget);
            widget.load(true);
          }
          placeholderEl.parentNode.removeChild(placeholderEl);
          el = doc.getElementById(prefix + data);
          if (el) el.style.opacity = 1; 
        }

        event.preventDefault();
        event.stopPropagation();
      }
    }, 

    dragEnter: function(event) {
      if (event.dataTransfer.types.indexOf('application/mpage-widget') != -1 ||
          event.dataTransfer.types.indexOf('text/plain') != -1) { 

        event.preventDefault();
        event.stopPropagation();
      }
    },

    dragLeave: function(event) {
      if (event.dataTransfer.types.indexOf('application/mpage-widget') != -1 ||
          event.dataTransfer.types.indexOf('text/plain') != -1) { 

        var doc = View.getDoc();
        var placeholderEl = doc.getElementById('dd-placeholder'); 
        var isDescendant = function(parentEl, childEl) {
          if (childEl == null)
            return false;
          else if (childEl.parentNode == parentEl)
            return true;
          else
            return isDescendant(parentEl, childEl.parentNode);

        };

        event.preventDefault();
        event.stopPropagation();
      }
    },

    dragEnd: function(event) {
      var data = event.dataTransfer.getData('application/mpage-widget');
      var doc = View.getDoc();
      var prefix = DragAndDrop.widgetHandler.prefixEl;
      var el = doc.getElementById(prefix + data);
      if (el) el.style.opacity = 1; 
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
