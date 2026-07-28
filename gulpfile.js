const { src, dest, watch, series } = require('gulp');
const path = require('path');
const serveStatic = require('serve-static');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync').create();

// Compile each component SCSS (exclude partials starting with _) and output CSS next to the SCSS
function styles() {
  return src('blocks/**/[^_]*.scss', { base: 'blocks', sourcemaps: true })
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(sourcemaps.write('.')) // writes .map file next to .css
    .pipe(dest('blocks')) // preserves folder structure because base is 'blocks'
    .pipe(browserSync.stream({ match: '**/*.css' })); // inject CSS into browser
}

// Compile global styles.scss to styles/styles.css
function globalStyles() {
  return src('styles/styles.scss', { sourcemaps: true })
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('styles'))
    .pipe(browserSync.stream({ match: '**/*.css' }));
}

function serve() {
  // By default proxy the live site so localhost:3003 loads index from da.live.
  // Use BS_PROXY to override if you want a different backend.
  const proxyTarget = process.env.BS_PROXY || 'https://da.live';

  // If you don't want to proxy (serve static files), comment proxy and use server option:
  // browserSync.init({ server: { baseDir: './' }, open: false, notify: false });

  // Support a static fallback directory via env var `BS_STATIC_DIR` for local testing
  // If `BS_STATIC_DIR` is set, serve static files from that directory instead of proxying.
  const staticDir = process.env.BS_STATIC_DIR;
  const overrideDir = process.env.BS_OVERRIDE_DIR ? path.resolve(process.env.BS_OVERRIDE_DIR) : null;
  const middleware = [];

  if (overrideDir) {
    middleware.push(serveStatic(overrideDir, { index: ['index.html'] }));
  }

  // Always serve local files if they exist, before proxying.
  middleware.push(serveStatic(path.resolve(__dirname), { index: false }));

  if (staticDir) {
    browserSync.init({
      server: { baseDir: [staticDir, '.'] },
      middleware,
      open: false,
      notify: false,
    });
  } else {
    browserSync.init({
      proxy: proxyTarget,
      middleware,
      open: false,
      notify: false,
    });
  }

  // Watch SCSS (including partials). When partials change we still run the styles task so dependent CSS updates.
  watch('blocks/**/*.scss', styles);
  watch('styles/**/*.scss', globalStyles);

  // Watch other files (html, markup, etc.) and reload full page on changes
  watch(['blocks/**/*.html', '*.html', 'index.html']).on('change', browserSync.reload);
}

exports.styles = series(globalStyles, styles);
exports.serve = series(exports.styles, serve);
exports.watch = exports.serve;
exports.default = exports.serve;
