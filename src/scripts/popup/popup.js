'use strict';


window.onload = () => {
  localization();
}

var localization = () => {
    document.querySelectorAll('[data-i18n]')
    .forEach((node) => {
        node.textContent = browser.i18n.getMessage(node.dataset.i18n);
    });
}


document.addEventListener('click', (e) => {
  if (e.target.id === 'add') {
    browser.runtime.sendMessage({cmd: 'add'});
    window.close();
  } else if (e.target.id === 'open') {
    browser.runtime.sendMessage({cmd: 'open'});
    window.close();
  }
});