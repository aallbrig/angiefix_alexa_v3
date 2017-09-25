const gulp = require('gulp');
const replace = require('gulp-replace');
const uglify = require('gulp-uglify');
const clipboard = require('gulp-clipboard');

gulp.task('rewriteIncorrectRequireStatement', () => {
  gulp.src(['dist/main.js'])
    .pipe(replace('var AWS = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \\"aws-sdk\\""); e.code = \'MODULE_NOT_FOUND\'; throw e; }()));', 'var AWS = require("aws-sdk");'))
    .pipe(replace('var DOC = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \\"dynamodb-doc\\""); e.code = \'MODULE_NOT_FOUND\'; throw e; }()));', 'var DOC = require("dynamodb-doc");'))
    .pipe(uglify())
    .pipe(clipboard())
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', () => {
  gulp.watch('dist/main.js', ['rewriteIncorrectRequireStatement']);
});
