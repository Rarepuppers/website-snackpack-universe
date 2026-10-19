/* Complete books include their artwork and shared reader dependencies. */
(function () {
  'use strict';
  var box = document.querySelector('.read-offline');
  if (!box || !('caches' in window) || !('serviceWorker' in navigator)) return;
  var saveButton = box.querySelector('[data-read-offline]'), status = box.querySelector('[data-read-offline-status]');
  var slug = box.getAttribute('data-offline-book'), remove = box.querySelector('[data-read-remove]'), cancel = box.querySelector('[data-read-cancel]');
  function control(attr,text) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'text-link';
    b.setAttribute(attr,''); b.textContent = text; b.hidden = true; box.insertBefore(b,status); return b;
  }
  if (!remove) remove = control('data-read-remove','Remove saved bookshelf');
  if (!cancel) cancel = control('data-read-cancel','Cancel saving');
  var manifest, running = false, controller;
  box.hidden = false;
  function mb(bytes) { return (bytes / 1048576).toFixed(1) + ' MB'; }
  function say(text) { status.textContent = text; }
  function load() {
    if (manifest) return Promise.resolve(manifest);
    return fetch('/read/offline-manifest.json',{cache:'no-store'}).then(function (r) {
      if (!r.ok) throw Error('manifest'); return r.json();
    }).then(function (m) {
      if (m.version !== 2 || !Array.isArray(m.bookFiles) || !Array.isArray(m.shared)) throw Error('manifest');
      manifest = m; return m;
    });
  }
  function cacheName() {
    return new Promise(function (resolve) {
      var worker = navigator.serviceWorker.controller;
      if (!worker || !window.MessageChannel) return resolve(null);
      var channel = new MessageChannel(), timer = setTimeout(function () { channel.port1.close(); resolve(null); },1200);
      channel.port1.onmessage = function (event) {
        clearTimeout(timer); channel.port1.close(); resolve(/^snackpack-arcade-v\d+$/.test(event.data) ? event.data : null);
      };
      worker.postMessage({type:'READ_CACHE_NAME'},[channel.port2]);
    }).then(function (name) {
      if (name) return name;
      // Compatibility with an older active worker; never use arbitrary key order.
      return caches.keys().then(function (keys) {
        return keys.filter(function (k) { return /^snackpack-arcade-v\d+$/.test(k); })
          .sort(function (a,b) { return Number(a.split('-v')[1]) - Number(b.split('-v')[1]); }).pop() || null;
      });
    });
  }
  function selected(m) { return slug ? m.bookFiles.filter(function (b) { return b.slug === slug; }) : m.bookFiles; }
  function urlsFor(m) { return Array.from(new Set(m.shared.concat.apply(m.shared,selected(m).map(function (b) { return b.urls; })))); }
  function inspect(m,name) {
    if (!name) return Promise.resolve({complete:0,any:false});
    return caches.open(name).then(function (cache) {
      var urls = urlsFor(m);
      return Promise.all(urls.map(function (u) { return cache.match(u).then(async function (r) {
        if (!r || !r.ok) return false;
        var book = selected(m).find(function (b) { return b.urls[0] === u; });
        if (!book) return true;
        var text = (await r.text()).replace(/\r\n/g,'\n');
        var digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
        return Array.from(new Uint8Array(digest)).map(function (n) { return n.toString(16).padStart(2,'0'); }).join('') === book.html_sha256;
      }); })).then(function (hits) {
        var present = new Set(urls.filter(function (_,i) { return hits[i]; }));
        var sharedReady = m.shared.every(function (u) { return present.has(u); });
        return {complete:selected(m).filter(function (b) { return sharedReady && b.urls.every(function (u) { return present.has(u); }); }).length,
          any:selected(m).some(function (b) { return b.urls.some(function (u) { return present.has(u); }); })};
      });
    });
  }
  function refresh(note) {
    return Promise.all([load(),cacheName()]).then(function (values) {
      var m = values[0], name = values[1], books = selected(m);
      if (!books.length) throw Error('book');
      return inspect(m,name).then(function (saved) {
        var all = saved.complete === books.length;
        saveButton.textContent = all ? 'Saved for offline' : slug ? 'Save this book for offline' : 'Save all ' + books.length + ' books for offline';
        saveButton.disabled = running || all; remove.hidden = !saved.any; remove.disabled = running;
        var size = slug ? books[0].bytes : m.bytes;
        var detail = all ? (slug ? 'This complete book is saved on this device.' : 'All ' + books.length + ' complete books are saved on this device.') :
          (slug ? 'This book is not fully saved.' : saved.complete + ' of ' + books.length + ' complete books saved.') + ' About ' + mb(size) + ' of artwork' + (slug ? ', plus shared reader files.' : '.');
        say((note ? note + ' ' : '') + detail + ' PDFs are not included. Your browser may clear saved files when storage is low.');
      });
    }).catch(function () { saveButton.disabled = running; say((note ? note + ' ' : '') + 'Offline saving is unavailable right now. Reconnect and try again.'); });
  }
  function ready() {
    return new Promise(function (resolve,reject) {
      var timer = setTimeout(function () { reject(Error('worker')); },10000);
      controller.signal.addEventListener('abort',function () { clearTimeout(timer); reject(Error('cancelled')); },{once:true});
      navigator.serviceWorker.register('/sw.js').then(function () { return navigator.serviceWorker.ready; })
        .then(function () { clearTimeout(timer); resolve(); },function (e) { clearTimeout(timer); reject(e); });
    });
  }
  async function save() {
    if (running) return;
    running = true; controller = new AbortController(); saveButton.disabled = true; remove.disabled = true; cancel.hidden = false; say('Getting ready…');
    var failed = 0, stopped = false;
    try {
      await ready(); var m = await load(), name = await cacheName();
      if (!name) throw Error('cache');
      var cache = await caches.open(name), urls = urlsFor(m), done = 0, next = 0;
      async function worker() {
        while (next < urls.length && !controller.signal.aborted) {
          var url = urls[next++];
          try {
            var hit = await cache.match(url);
            if (!hit || !hit.ok || !url.endsWith('.webp')) {
              var response = await fetch(url,{signal:controller.signal,cache:'reload'});
              if (!response.ok) throw Error('fetch');
              var body = await response.arrayBuffer();
              if (controller.signal.aborted) break;
              await cache.put(url,new Response(body,{status:response.status,headers:response.headers}));
            }
          } catch(e) { if (!controller.signal.aborted) failed++; }
          done++; say('Saving… ' + Math.round(done / urls.length * 100) + '%');
        }
      }
      await Promise.all([worker(),worker(),worker(),worker()]); stopped = controller.signal.aborted;
    } catch(e) { stopped = controller.signal.aborted; if (!stopped) failed++; }
    running = false; cancel.hidden = true; remove.disabled = false;
    await refresh(stopped ? 'Saving cancelled. Completed files are kept; you can continue saving.' : failed ? 'Some files could not be saved. Reconnect and try again to finish.' : '');
  }
  saveButton.addEventListener('click',save);
  cancel.addEventListener('click',function () { if (controller) { controller.abort(); say('Cancelling…'); } });
  remove.addEventListener('click',async function () {
    if (running) return;
    remove.disabled = true; saveButton.disabled = true;
    try {
      var m = await load(), name = await cacheName();
      if (name) {
        var cache = await caches.open(name);
        // Remove reading pages/art only, including variants. Keep shared files,
        // games, other books and other caches intact.
        var prefixes = selected(m).map(function (b) { return '/read/' + b.slug + '/'; });
        var keys = await cache.keys();
        await Promise.all(keys.filter(function (r) { return prefixes.some(function (prefix) { return new URL(r.url).pathname.indexOf(prefix) === 0; }); }).map(function (r) { return cache.delete(r); }));
      }
      await refresh('Saved book files removed.'); saveButton.focus();
    } catch(e) { remove.disabled = false; saveButton.disabled = false; say('Could not remove saved books. Try again.'); }
  });
  window.addEventListener('online',function () { if (!running) { manifest = null; refresh(); } });
  navigator.serviceWorker.addEventListener('controllerchange',function () { if (!running) refresh(); });
  refresh();
})();
