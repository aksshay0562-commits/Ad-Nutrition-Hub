/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "cda391256d27b44bbda81d880b5b6567"
  }, {
    "url": "pwa-512x512.png",
    "revision": "1096f2f51ed13d914bfa2767f2495628"
  }, {
    "url": "pwa-192x192.png",
    "revision": "b943f7613bbedf5632060f70d52cbe91"
  }, {
    "url": "index.html",
    "revision": "3874b98e652ac30c0f6526518337b34b"
  }, {
    "url": "icon.svg",
    "revision": "39bf830611b0e3be45bba48c264ccf1d"
  }, {
    "url": "favicon.png",
    "revision": "27b06c6920c35cdfb14c650ef3849af7"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8c99d2b8d50809cd09b56e4e7838189f"
  }, {
    "url": "assets/index-C4bUKvp-.css",
    "revision": null
  }, {
    "url": "assets/index-B5SS_T5X.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8c99d2b8d50809cd09b56e4e7838189f"
  }, {
    "url": "favicon.png",
    "revision": "27b06c6920c35cdfb14c650ef3849af7"
  }, {
    "url": "icon.svg",
    "revision": "39bf830611b0e3be45bba48c264ccf1d"
  }, {
    "url": "pwa-192x192.png",
    "revision": "b943f7613bbedf5632060f70d52cbe91"
  }, {
    "url": "pwa-512x512.png",
    "revision": "1096f2f51ed13d914bfa2767f2495628"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "cda391256d27b44bbda81d880b5b6567"
  }, {
    "url": "manifest.webmanifest",
    "revision": "903c6fdc8975d3e358ea66c62c25c484"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
