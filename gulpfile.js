var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    gulpLiveServer = require('gulp-live-server'),
    concat = require('gulp-concat');

var watchedFiles = ['./public/scripts/script.js', 'public/lib/*.js', './public/controllers/index.js'];

gulp.task('jshint', function () {
    return gulp.src(watchedFiles)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('serve', function() {
    var server = gulpLiveServer.new('server.js');
    server.start();

    gulp.watch(watchedFiles, function (file) {
        server.start.apply(server);
    });
});

gulp.task('scripts', function() {
  return gulp.src(watchedFiles)
    .pipe(concat('concat.js'))
    .pipe(gulp.dest('./public/scripts/'));
});

gulp.task('listen', function() {
    gulp.watch(watchedFiles, ['jshint', 'scripts']);
});

gulp.task('default', ['scripts', 'listen', 'serve']);
