/* eslint arrow-body-style: 0 */

const gulp = require('gulp');
const changed = require('gulp-changed');
const tap = require('gulp-tap');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
// const uglify = require('gulp-uglify');
const sass = require('gulp-sass');
const gls = require('gulp-live-server');
// const debug = require('gulp-debug');

sass.compiler = require('node-sass');

// https://github.com/gulpjs/gulp/blob/master/docs/recipes/browserify-with-globs.md
gulp.task('js', () => {
  return gulp.src('./src/static/js/*.js', { read: false, base: './src/static/js/' })
    .pipe(changed('./app/static/js/'))
    .pipe(tap((file) => {
      // eslint-disable-next-line no-param-reassign
      file.contents = browserify(file.path, { debug: true }).bundle();
    }))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(babel())
    // .pipe(uglify())
    .pipe(rev())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./app/static/js/'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('./app/static/js/'));
});

gulp.task('vendorjs', () => {
  return gulp.src(['./src/static/js/vendor/*.js', './src/static/js/vendor/*.js.map'])
    .pipe(gulp.dest('./app/static/js/vendor/'));
});

gulp.task('scss', () => {
  return gulp.src('./src/static/scss/**/*.scss', { base: './src/static/scss/' })
    .pipe(changed('./app/static/css/'))
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(rev())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./app/static/css/'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('./app/static/css/'));
});

gulp.task('images', () => {
  return gulp.src('./src/static/images/*')
    .pipe(gulp.dest('./app/static/images/'));
});

gulp.task('ejs', () => {
  const jsManifest = gulp.src('./app/static/js/rev-manifest.json');
  const cssManifest = gulp.src('./app/static/css/rev-manifest.json');
  return gulp.src('./src/views/**/*.ejs', { base: './src/' })
    .pipe(revRewrite({ manifest: jsManifest }))
    .pipe(revRewrite({ manifest: cssManifest }))
    .pipe(gulp.dest('./app/'));
});

gulp.task('build', gulp.series('js', 'vendorjs', 'scss', 'ejs', 'images'));

gulp.task('watch', () => {
  gulp.watch('./src/static/scss/**/*.scss', gulp.series('scss'));
  gulp.watch('./src/static/js/**/*.js', gulp.series('js'));
  gulp.watch('./src/static/images/*', gulp.series('images'));
  gulp.watch('./src/views/**/*.ejs', gulp.series('ejs'));
});

gulp.task('serve', () => {
  const server = gls.new('./server.js');
  server.start();

  gulp.watch([
    './app/static/css/**/*.css',
    './app/static/js/**/*.js',
    './app/static/images/*',
    './app/views/**/*.ejs',
  ]).on('change', path => server.notify.call(server, { path }));

  gulp.watch('./server.js')
    .on('change', () => server.start.bind(server)());
});

gulp.task('dev', gulp.series('build', gulp.parallel('watch', 'serve')));
