const gulp = require("gulp");
const sass = require("gulp-sass");
const cleanCSS = require('gulp-clean-css');
const webpack = require('webpack');
const WebpackMessages = require('webpack-messages');
const gulpWebpack = require('webpack-stream');
const browserSync = require('browser-sync').create();
const path = require("path");

const SRC_DIR = "src"; //Source directory
const DIST_DIR = "dist"; //Distribution directory

gulp.task(function scss(){
    return gulp.src(SRC_DIR + '/main.scss')
        .pipe(sass().on('error', sass.logError))
        //Minify and optimize
        /*.pipe(cleanCSS({debug: true}, (details) => {
          console.log(details.name + ": " + details.stats.originalSize);
          console.log(details.name + ": " + details.stats.minifiedSize);
        }))*/
        .pipe(gulp.dest( DIST_DIR + "/css" ))
        .pipe(browserSync.stream());
});

gulp.task(function jsBrowser(){
    return gulp.src("./")
        .pipe(gulpWebpack( {
        mode : "development",
        context : path.resolve(__dirname, "./" + SRC_DIR),
        entry : {
            main: "./web.js"
        },
        output : {
            //path : //handled by gulp
            filename : "[name].js",
            library : "tmd",
            libraryTarget : "umd",
            //https://github.com/webpack/webpack/issues/6525
            //Until webpack implements a solution that solves all their
            //corner cases, this will work in NodeJS, Browser, and Webworkers
            //for us!
            globalObject: "typeof self !== 'undefined' ? self : this"
        },
        module : {
            rules : [{
                test : /\.(js|json)$/,
                exclude : /node_modules/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                "targets": {
                                    "browsers": [
                                        "last 2 versions",
                                        "IE >= 11"
                                    ]
                                }
                            }],
                        ],
                        plugins: [
                            ['@babel/plugin-transform-runtime', {
                                "regenerator": true,
                            }]
                        ],
                        cacheDirectory : true
                    }
                }]
            }]
        },
        devtool: "source-map",
        plugins: [
            //Show webpack stats messages (TODO: Make our own _cool_ one)
            new WebpackMessages({
              name: "WEBPACK BUILD",
              logger: str => console.log(`| ${str}`)
            })
        ]
    }, webpack ))
        .pipe(gulp.dest( DIST_DIR + "/js" ));
});

gulp.task(function serve(){
    browserSync.init({
        server: {
            port: 10101,
            baseDir: "."
        }
    });
});

//TODO: Readd prod build
gulp.task("build", gulp.parallel("jsBrowser", "scss"));
gulp.task(function watch(){
    gulp.watch(SRC_DIR + "/*.scss", gulp.task("scss"));
    gulp.watch(SRC_DIR + "/*.js", gulp.series("jsBrowser", function reload(done){
        browserSync.reload();
        done();
    }));
});
gulp.task("dev", gulp.series("build", gulp.parallel("watch", "serve")));
gulp.task("default", gulp.task("dev"));
