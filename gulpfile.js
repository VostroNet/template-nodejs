"use strict"; //eslint-disable-line
const gulp = require("gulp");
const eslint = require("gulp-eslint");
const del = require("del");
const babel = require("gulp-babel");
const sourcemaps = require("gulp-sourcemaps");
const path = require("path");

require("dotenv/config");
const jest = require("gulp-jest").default;
const jestConfig = require("./jest.config");

gulp.task("clean", () => {
  return del(["build/**/*"]);
});

gulp.task("lint", gulp.series("clean", () => {
  return gulp.src(["src/**/*.js"])
    .pipe(eslint({
      fix: true,
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}));

gulp.task("compile:publish", gulp.series("lint", () => {
  return gulp.src(["src/**/*"])
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write(".", {
      includeContent: false,
      sourceRoot: process.env.NODE_ENV === "production" ? "../src/" : path.resolve(__dirname, "./src/")
    }))
    .pipe(gulp.dest("build/"));
}));

gulp.task("compile", gulp.series("lint", () => {
  return gulp.src(["src/**/*.js"])
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write(".", {
      includeContent: false,
      sourceRoot: "../src/",
    }))
    .pipe(gulp.dest("build/"));

}));

gulp.task("test", function() {
  process.env.NODE_ENV = "test";
  return gulp.src("./__tests__/**/*.test.js")
    .pipe(jest(jestConfig));
});

gulp.task("build", gulp.series("compile"));
gulp.task("watch", () => {
  gulp.watch("src/**/*.*", gulp.parallel("build"));
});

gulp.task("default", gulp.series("build"));
