'use strict';

document.addEventListener('click', (e) => {
  if (e.target.id === 'add') {
    browser.runtime.sendMessage({cmd: 'add'});
    window.close();
  } else if (e.target.id === 'open') {
    browser.runtime.sendMessage({cmd: 'open'});
    window.close();
  }
});

