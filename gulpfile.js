/* Needs to be installed locally
  1: sudo npm install gulp
  2: sudo npm install --save-dev jshint gulp-jshint
*/

var gulp = require('gulp'),
    jshint = require('gulp-jshint');

gulp.task('jshint', function () {
    return gulp.src(['scripts/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('listen', function() { gulp.watch('scripts/*.js', ['jshint']); });

gulp.task('default', ['listen']);