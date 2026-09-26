// Builds dist/bridge-design.html: a single self-contained page (CSS and app
// JS inlined, libraries from cdn.jsdelivr.net) for hosting as a claude.ai
// artifact or on any static web host.  Run: node tools/build-artifact.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const html = read('index.html');
const CDN = {
  'vendor/exceljs.min.js': 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',
  'vendor/jspdf.umd.min.js': 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
  'vendor/jspdf.plugin.autotable.min.js': 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js',
  'vendor/jszip.min.js': 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
};
const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const fonts = (html.match(/<link rel="(preconnect|stylesheet)" href="https:\/\/fonts[^>]*>/g) || []).join('\n');
let body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
body = body.replace(/<script src="([^"]+)"( defer)?><\/script>/g, (m, src) => {
  if (CDN[src]) return `<script src="${CDN[src]}"></script>`;
  // keep "</script" out of inlined code
  return `<script>\n${read(src).replace(/<\/script/gi, '<\\/script')}\n</script>`;
});
const out = `${title}\n${fonts}\n<style>\n${read('css/style.css')}\n</style>\n${body.trim()}\n`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/bridge-design.html'), out);
console.log('dist/bridge-design.html', (out.length / 1024).toFixed(0), 'KB');
