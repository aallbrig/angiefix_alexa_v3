var gulp = require('gulp');
var replace = require('gulp-replace');
var watch = require('gulp-watch');
var trimlines = require('gulp-trimlines');

gulp.task('rewriteIncorrectRequireStatement', function(){
  gulp.src(['dist/main.js'])
    .pipe(replace('var AWS = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \\"aws-sdk\\""); e.code = \'MODULE_NOT_FOUND\'; throw e; }()));', 'var AWS = require("aws-sdk");'))
    .pipe(replace('var DOC = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \\"dynamodb-doc\\""); e.code = \'MODULE_NOT_FOUND\'; throw e; }()));', 'var DOC = require("dynamodb-doc");'))
    .pipe(trimlines())
    .pipe(gulp.dest('dist'));
});

gulp.task('compress', function() {
  return gulp.src('dist/main.js')
    .pipe(uglify())
    .pipe(gulp.dest('build'));
});

gulp.task('watch', function() {
    gulp.watch('dist/main.js', ['rewriteIncorrectRequireStatement']);
});
