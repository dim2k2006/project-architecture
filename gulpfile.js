var gulp = require('gulp'),
	wiredep = require('wiredep').stream,
	useref = require('gulp-useref'),
	gulpif = require('gulp-if'),
	uglify = require('gulp-uglify'),
	minifyCss = require('gulp-minify-css'),
	clean = require('gulp-clean'),
	importCss = require('gulp-import-css'),
	runSequence = require('run-sequence'),
	file = require('gulp-file'),
	browserSync = require('browser-sync').create(),
	glob = require('glob'),
	pages = [];



// Clean blocks from old css import files
gulp.task('clean-blocks', function () {
	return gulp.src('./app/blocks/**/blocks.style.*', {read: false})
		.pipe(clean());
});



// Prepare new css import files
gulp.task('prepare', function() {
	var folders = glob.sync("./app/blocks/*");

	folders.map(function(folder) {
		folder = folder.split('/').reverse()[0];
		pages.push('blocks/' + folder + '/');
	});
	
	pages.map(function(page) {
		glob("./app/"+ page +"*", function (er, files) {
	 	
		 	var str = '',
		 		block = '';
		 	files.map(function(file) {
		 		block = file.split('/').reverse()[0];
		 		

				str += "@import url('" + block + "/" + block + ".css');\n";
			});

			return file('blocks.style.css', str, { src: true }).pipe(gulp.dest('app/' + page));
		})
	})
});



// Web server + livereload
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "app"
        }
    });

    gulp.watch('./app/*.html').on('change', browserSync.reload);
    gulp.watch('./app/blocks/**/*.css').on('change', browserSync.reload);
    gulp.watch('./app/blocks/**/*.js').on('change', browserSync.reload);
    gulp.watch('bower.json', ['bower']);
});



// Bower wiredep
gulp.task('bower', function () {
	gulp.src('./app/*.html')
	.pipe(wiredep({
		directory : "app/bower_components"
	}))
	.pipe(gulp.dest('./app'));
});



// CSS import
// gulp.task('import', function () {
//   gulp.src('assets/*.css')
//     .pipe(importCss())
//     .pipe(gulp.dest('dist/'));
// });



// BUILD TASKS



// Build
gulp.task('build', ['move'], function () {
    var assets = useref.assets();
    
    return gulp.src('app/*.html')
        .pipe(assets)
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss({rebase: false})))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});



// Clean
gulp.task('clean', function () {
	return gulp.src('dist', {read: false})
		.pipe(clean());
});




// Move images and fonts to dist
gulp.task('move', ['clean'], function() {
	gulp.src('./app/images/*')
	.pipe(gulp.dest('dist/images'));

	gulp.src('./app/fonts/*')
	.pipe(gulp.dest('dist/fonts'));
});






// RUN TASKS



// Default task
gulp.task('default', function(callback) {
	runSequence('clean-blocks', 'prepare', 'browser-sync', callback);
});