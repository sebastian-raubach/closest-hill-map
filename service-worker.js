if(!self.define){let e,s={};const i=(i,r)=>(i=new URL(i+".js",r).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(r,c)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(s[o])return;let t={};const n=e=>i(e,o),l={module:{uri:o},exports:t,require:n};s[o]=Promise.all(r.map((e=>l[e]||n(e)))).then((e=>(c(...e),t)))}}define(["./workbox-2d118ab0"],(function(e){"use strict";e.setCacheNameDetails({prefix:"closesthillmap"}),self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"css/app.36ff747b.css",revision:null},{url:"index.html",revision:"098a2cf9fe6cd00f5c68a4944e8c0e22"},{url:"js/app.a00c623c.js",revision:null},{url:"manifest.json",revision:"520ce8655c1cfdf7b2ce6eb7fa86db4f"},{url:"robots.txt",revision:"b6216d61c03e6ce0c9aea6ca7808f7ca"}],{})}));
//# sourceMappingURL=service-worker.js.map
