// Author: Matija Podravec, 2012-2013

if (!mpagespace.dd) mpagespace.dd = {};
else if (typeof mpagespace.dd != 'object')
  throw new Error('mpagespace.dd already exists and is not an object');

mpagespace.dd = {
  pageHandler: {
    prefixEl: 'page-',

    dragStart: function(event) {
      var prefix = mpagespace.dd.pageHandler.prefixEl;
      var pageId = parseInt(this.getAttribute('id').substr(prefix.length));
      event.dataTransfer.setData('application/mpage-page', pageId); 
      event.stopPropagation();
    },

    dragOver: function(event) {
      var prefix = mpagespace.dd.pageHandler.prefixEl;
      var doc = mpagespace.view.getDoc();
      var refEl = null;

      if (event.dataTransfer.types.contains('application/mpage-page')) {
        var indicatorBarEl = doc.getElementById('nav-drop-indicator-bar'); 
        indicatorBarEl.style.display = 'block';
        for (var n=this.lastChild; n; n=n.previousSibling) {
          if (n.nodeName.toLowerCase() == 'li' && 
            n.getAttribute('id').indexOf(prefix) != -1) {
              if ((event.layerX + 1 - n.offsetLeft) / n.offsetWidth < 0.5) {
                refEl = n;
              } else
                break;
          }
        }
        if (refEl != indicatorBarEl.nextSibling) {
          if (refEl == null)
            indicatorBarEl.style.left = (this.lastChild.offsetLeft + this.lastChild.offsetWidth - 1) + 'px';
          else
            indicatorBarEl.style.left = (refEl.offsetLeft - 1) + 'px';
          indicatorBarEl._mpagespace = {refEl: refEl};
        }

        event.preventDefault();
        event.stopPropagation();
      } else if (event.dataTransfer.types.contains('application/mpage-widget') ||
                 event.dataTransfer.types.contains('text/plain')) {
        for (var n=this.lastChild; n; n=n.previousSibling) {
          if (n.nodeName.toLowerCase() == 'li' && 
            n.getAttribute('id').indexOf(prefix) != -1 &&
            event.layerX >= n.offsetLeft &&
            event.layerX <= n.offsetLeft + n.offsetWidth) {
              refEl = n;
              break;
          }
        }

        var pageId = parseInt(refEl.getAttribute('id').substr(prefix.length)); 
        var timerCallback = {
          notify: function() {
            mpagespace.app.openPage(pageId);
          }
        };
        if (this._mpagespace == null) {
          this._mpagespace = {};
        } 
        if (this._mpagespace.pageToOpen != pageId) {
          if (this._mpagespace.timer)
            this._mpagespace.timer.cancel();
          var timer = Components.classes["@mozilla.org/timer;1"]
            .createInstance(Components.interfaces.nsITimer);
          timer.initWithCallback(timerCallback, 500, timer.TYPE_ONE_SHOT);
          this._mpagespace.timer = timer;
          this._mpagespace.pageToOpen = pageId;
        }

        event.preventDefault();
        event.stopPropagation();
      }
    },

    drop: function(event) {
      if (event.dataTransfer.types.contains('application/mpage-page')) {
        var prefix = mpagespace.dd.pageHandler.prefixEl;
        var doc = mpagespace.view.getDoc();
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
        mpagespace.app.getModel().setPageOrder(order);

        event.preventDefault();
        event.stopPropagation();
      }
    },

    dragEnter: function(event) {
      if (event.dataTransfer.types.contains('application/mpage-widget') ||
          event.dataTransfer.types.contains('text/plain')) {
        event.preventDefault();
        event.stopPropagation();
      }
    },

    dragLeave: function(event) {
      if (event.dataTransfer.types.contains('application/mpage-widget') ||
          event.dataTransfer.types.contains('text/plain')) {
        if (this._mpagespace && this._mpagespace.timer) {
          this._mpagespace.timer.cancel(); 
          this._mpagespace = null;
        }
        event.preventDefault();
        event.stopPropagation();
      } else if (event.dataTransfer.types.contains('application/mpage-page')) {
        var doc = mpagespace.view.getDoc();
        var indicatorBarEl = doc.getElementById('nav-drop-indicator-bar'); 
        indicatorBarEl.style.display = 'none';

        event.preventDefault();
        event.stopPropagation();
      }
    },

    dragEnd: function(event) {
      if (event.dataTransfer.types.contains('application/mpage-page')) {
        var doc = mpagespace.view.getDoc();
        var indicatorBarEl = doc.getElementById('nav-drop-indicator-bar'); 
        indicatorBarEl.style.display = 'none';

        event.preventDefault();
        event.stopPropagation();
      }
    }
  }, 

  menuHandler: {
    prefixEl: 'mpagespace-page-menuitem-',

    dragStart: function(event) {
      var prefix = mpagespace.dd.menuHandler.prefixEl;
      event.dataTransfer.setData('application/mpage-page', 
          parseInt(this.getAttribute('id').substr(prefix.length))); 
      event.stopPropagation();
    },

    dragEnter: function(event) {
      if (!event.dataTransfer.types.contains('application/mpage-widget')) 
        return;

      if (this.nodeName.toLowerCase() == 'toolbarbutton') {
        this.open = true;
      } else if (this.nodeName.toLowerCase() == 'menupopup') {
        if (this._mpagespace == null)
          this._mpagespace = {};
      } 
      event.preventDefault();
      event.stopPropagation();
    },

    dragOver: function(event) {
      if (event.dataTransfer.types.contains('application/mpage-page')) {
        if (this._mpagespace && this._mpagespace.timer) {
          this._mpagespace.timer.cancel();
        }
        var indicatorBarEl = document.getElementById('mpagespace-drop-indicator-bar'); 
        indicatorBarEl.hidden = false;
        var refEl = this.lastChild;
        for (var n=this.lastChild; n; n=n.previousSibling) {
          if (n.nodeName.toLowerCase() == 'menuitem' && 
              n.getAttribute('id').indexOf('mpagespace-page-menuitem-') != -1) {
              if ((event.screenY + 1 - n.boxObject.screenY) / n.boxObject.height < 0.5) {
                refEl = n;
              } else
                break;
          }
        }
        if (refEl != indicatorBarEl.nextSibling)
          this.insertBefore(indicatorBarEl, refEl);
        event.preventDefault();
        event.stopPropagation();

      } else if (event.dataTransfer.types.contains('application/mpage-widget')) {
        if (this._mpagespace && this._mpagespace.timer) {
          this._mpagespace.timer.cancel();
        }
        for (var n=this.firstChild; n; n=n.nextSibling) {
          if (n.nodeName.toLowerCase() == 'menuitem' &&
              n.getAttribute('id').indexOf('mpagespace-page-menuitem-') != -1) {
            n.removeAttribute('_moz-menuactive');
            if (event.screenY > n.boxObject.screenY &&
                event.screenY + 1 - n.boxObject.screenY < n.boxObject.height) {
              n.setAttribute('_moz-menuactive', true);
              this._mpagespace.menuactive = n;
            }
          }
        }
        event.preventDefault();
        event.stopPropagation();
      }
    },

    dragLeave: function(event) {
      var isDescendant = function(parentEl, childEl) {
        if (childEl == null)
          return false;
        else if (childEl.parentNode == parentEl)
          return true;
        else
          return isDescendant(parentEl, childEl.parentNode);
      };

      if (event.dataTransfer.types.contains('application/mpage-widget') ||
          event.dataTransfer.types.contains('application/mpage-page')) {
        if (!isDescendant(this, event.relatedTarget) &&
            this.nodeName.toLowerCase() == 'menupopup') {
          var timer = Components.classes["@mozilla.org/timer;1"]
            .createInstance(Components.interfaces.nsITimer);
          var self = this;
          var timerCallback = {
            notify: function() {
              if (event.dataTransfer.types.contains('application/mpage-widget')) {
                for (var n=self.firstChild; n; n=n.nextSibling) {
                  n.removeAttribute('_moz-menuactive');
                }
                self.parentNode.open = false; 
              } else {
                document.getElementById('mpagespace-drop-indicator-bar').hidden = true; 
              }
            }
          };
          timer.initWithCallback(timerCallback, 350, timer.TYPE_ONE_SHOT);
          if (this._mpagespace == null) {
            this._mpagespace = {};
          }
          this._mpagespace.timer = timer;
        } 
        event.preventDefault();
        event.stopPropagation();
      }
    },

    drop: function(event) {
      var data, pageId;
      var model = mpagespace.app.getModel();
      var prefix = mpagespace.dd.menuHandler.prefixEl;

      if (event.dataTransfer.types.contains('application/mpage-page')) {
        data = event.dataTransfer.getData('application/mpage-page');
        var targetId = event.target.getAttribute('id');
        var suffix = targetId.substr(targetId.lastIndexOf('-'));
        var el = document.getElementById(prefix + data + suffix);
        var indicatorBarEl = document.getElementById('mpagespace-drop-indicator-bar'); 
        indicatorBarEl.hidden = true;
        el.parentNode.insertBefore(el, indicatorBarEl);
        
        var order = [];
        for (;el && el.nodeName.toLowerCase() != 'menuseparator'; el = el.previousSibling); 
        for (el = el.nextSibling; el && el.nodeName.toLowerCase() != 'menuseparator'; el = el.nextSibling) {
          pageId = parseInt(el.getAttribute('id').substr(prefix.length)); 
          if (isNaN(pageId) == false) 
            order.push(pageId);
        }
        model.setPageOrder(order);
        event.preventDefault();
        event.stopPropagation();

      } else if (event.dataTransfer.types.contains('application/mpage-widget')) {
        data = event.dataTransfer.getData('application/mpage-widget');
        pageId = parseInt(this._mpagespace.menuactive.getAttribute('id').substr(prefix.length)); 

        if (isNaN(pageId) == false) {
          var widget = model.getPage().getWidget(data);
          model.moveWidgetToPage(widget, pageId);
        }
        event.preventDefault();
        event.stopPropagation();
      }
    }, 

    dragEnd: function(event) {
      event.preventDefault();
      event.stopPropagation();
    }
  },

  widgetHandler: {
    prefixEl: 'widget-',

    dragStart: function(event) {
      var doc = mpagespace.view.getDoc();
      var prefix = mpagespace.dd.widgetHandler.prefixEl;
      var widgetId = parseInt(this.getAttribute('id').substr(prefix.length));

      event.dataTransfer.setData('application/mpage-widget', widgetId); 
      event.dataTransfer.setDragImage(doc.getElementById('dd-feedback'), 19, 19);
      event.dataTransfer.effectAllowed = 'link';
      this.style.opacity = 0.3;
      event.stopPropagation();
    },

    dragOver: function(event) {
      if (event.dataTransfer.types.contains('application/mpage-widget') || 
          event.dataTransfer.types.contains('text/plain')) {
        var prefix = mpagespace.dd.widgetHandler.prefixEl;
        var doc = mpagespace.view.getDoc();
        var placeholderEl = doc.getElementById('dd-placeholder'); 
        if (!placeholderEl) {
          placeholderEl = doc.createElement('div');  
          placeholderEl.setAttribute('id', 'dd-placeholder');
          placeholderEl.setAttribute('class', 'widget');
        }

        if (this.className.indexOf('column') != -1) { 
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
            var el = doc.getElementById(prefix + event.dataTransfer.getData('application/mpage-widget')); 
            var placeholderHeight = el ? el.offsetHeight : 150; 
            placeholderEl.style.height = placeholderHeight + 'px';
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

        event.preventDefault();
        event.stopPropagation();
      }
    },

    drop: function(event) {
      var doc = mpagespace.view.getDoc(), data, el, widget;

      if (event.dataTransfer.types.contains('application/mpage-widget') ||
          event.dataTransfer.types.contains('text/plain')) {
        var placeholderEl = doc.getElementById('dd-placeholder'); 
        var prefix = mpagespace.dd.widgetHandler.prefixEl;

        if (placeholderEl) {
          var model = mpagespace.app.getModel();
          var page = model.getPage();
          var refWidgetEl = placeholderEl.nextSibling;
          var refWidget = null;
          if (refWidgetEl && refWidgetEl.className.indexOf('widget') != -1) {
            refWidget = page.getWidget(refWidgetEl.getAttribute('widget-id')); 
          }
          var panelId = placeholderEl.parentNode.getAttribute('id').substr('panel-'.length);

          if (event.dataTransfer.types.contains('application/mpage-widget')) {
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
            widget = mpagespace.app.getModel().getPage().createAndAddWidget(data, panelId, refWidget);
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
      if (event.dataTransfer.types.contains('application/mpage-widget') ||
          event.dataTransfer.types.contains('text/plain')) { 

        event.preventDefault();
        event.stopPropagation();
      }
    },

    dragLeave: function(event) {
      if (event.dataTransfer.types.contains('application/mpage-widget') ||
          event.dataTransfer.types.contains('text/plain')) { 

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
      }
    },

    dragEnd: function(event) {
      var data = event.dataTransfer.getData('application/mpage-widget');
      var doc = mpagespace.view.getDoc();
      var prefix = mpagespace.dd.widgetHandler.prefixEl;
      var el = doc.getElementById(prefix + data);
      if (el) el.style.opacity = 1; 
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
