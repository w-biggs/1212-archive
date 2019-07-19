/* eslint arrow-body-style: 0 */
const del = require('del');
const gulp = require('gulp');
const changed = require('gulp-changed');
const tap = require('gulp-tap');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const revDel = require('rev-del');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
// const uglify = require('gulp-uglify');
const sass = require('gulp-sass');
const gls = require('gulp-live-server');
// const debug = require('gulp-debug');

sass.compiler = require('node-sass');

const clean = function cleanDirectory(dir, done) {
  del(dir)
    .then(() => {
      if (done) {
        done();
      }
    });
};

// https://github.com/gulpjs/gulp/blob/master/docs/recipes/
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
    .pipe(revDel({
      dest: './app/static/js/',
      deleteMapExtensions: true,
    }))
    .pipe(gulp.dest('./app/static/js/'));
});

gulp.task('serverfiles', () => {
  return gulp.src(['./src/server.js', './src/server/*'], { base: './src/' })
    .pipe(gulp.dest('./app/'));
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
    .pipe(revDel({
      dest: './app/static/css/',
      deleteMapExtensions: true,
    }))
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

gulp.task('build', gulp.series((done) => { clean('./app/**', done); }, 'js', 'serverfiles', 'vendorjs', 'scss', 'ejs', 'images'));

gulp.task('watch', () => {
  gulp.watch('./src/static/scss/**/*.scss', gulp.series('scss', 'ejs'));
  gulp.watch('./src/static/js/**/*.js', gulp.series('js', 'ejs'));
  gulp.watch(['./src/server.js', './src/server/*.js'], gulp.series('serverfiles'));
  gulp.watch('./src/static/images/*', gulp.series('images'));
  gulp.watch('./src/views/**/*.ejs', gulp.series('ejs'));
});

gulp.task('serve', () => {
  const server = gls.new('./app/server.js');
  server.start();

  /* scss & js compilation automatically compile ejs already */
  gulp.watch([
    './app/static/images/*',
    './app/views/**/*.ejs',
  ]).on('change', path => server.notify.call(server, { path }));

  gulp.watch(['./app/server.js', './app/server/*', '!./app/server/cache/*'])
    .on('change', () => server.start.bind(server)());
});

gulp.task('dev', gulp.series('build', gulp.parallel('watch', 'serve')));
