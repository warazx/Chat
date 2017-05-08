var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    gulpLiveServer = require('gulp-live-server');

gulp.task('jshint', function () {
    return gulp.src(['public/scripts/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('serve', function() {
    var server = gulpLiveServer.new('server.js');
    server.start();

    gulp.watch('server.js', function (file) {
        server.start.apply(server);
    });
});

gulp.task('listen', function() { gulp.watch('scripts/*.js', ['jshint']); });

gulp.task('default', ['listen', 'serve']);
