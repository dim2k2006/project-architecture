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
	less = require('gulp-less'),
	concat = require('gulp-concat'),
	sourcemaps = require('gulp-sourcemaps'),
	path = require('path'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	url = require('gulp-css-url-adjuster'),
	autoprefixer = require('autoprefixer-core'),
	postcss = require('gulp-postcss'),
	pages = [],
	jsTasks = {};



// DEVELOPMENT TASKS



// Compile bootstrap
gulp.task('bootstrap', function() {
	return gulp.src('./app/blocks/vendor.blocks/bootstrap/bootstrap.less')
	    .pipe(less({
			paths: [ path.join(__dirname, 'less', 'includes') ]
		}))
		.pipe(gulp.dest('./app/blocks/vendor.blocks/bootstrap'))
		.pipe(browserSync.stream());
});



// Clean bundles
gulp.task('clean-bundles', function() {
	return gulp.src('./app/blocks/**/blocks.bundle.*', {read: false})
		.pipe(clean());
});




// Get levels
gulp.task('get-levels', function() {
	var folders = glob.sync("./app/blocks/*"),
		tasksNum = 0;

	folders.map(function(folder) {
		folder = folder.split('/').reverse()[0];
		pages.push('blocks/' + folder + '/');

		jsTasks['jsTask' + tasksNum] = 'blocks/' + folder + '/';
		tasksNum++;
	});
});



// Create css bundles
gulp.task('css-bundles', function() {	
	pages.map(function(page) {
		var files = glob.sync("./app/"+ page +"*"),
			str = '',
		 	block = '';

		files.map(function(file) {
	 		block = file.split('/').reverse()[0];
	 		
			str += "@import url('" + block + "/" + block + ".css');\n";
		});

		return file('blocks.bundle.css', str, { src: true }).pipe(gulp.dest('app/' + page));
	});
});



// Create js bundles
gulp.task('js-bundles', function() {	
	pages.map(function(page) {
		return gulp.src('./app/'+ page +'**/*.js')
			.pipe(sourcemaps.init())
    		.pipe(concat('blocks.bundle.js'))
    		.pipe(sourcemaps.write())
    		.pipe(gulp.dest('app/' + page));
	});
});



// Web server + livereload
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "app"
        }
    });

    

    // Watch html files
    gulp.watch('./app/*.html').on('change', browserSync.reload);

    // Watch css files
    gulp.watch('./app/blocks/**/*.css', ['css']);

    // Watch js files
    for (var key in jsTasks) {
    	gulp.watch('./app/'+ jsTasks[key] +'**/*.js', [key]);

    	(function(key) {
	    	gulp.task(key, function() {	
				return gulp.src('./app/'+ jsTasks[key] +'**/*.js')
				.pipe(sourcemaps.init())
	    		.pipe(concat('blocks.bundle.js'))
	    		.pipe(sourcemaps.write())
	    		.pipe(gulp.dest('app/' + jsTasks[key]))
	    		.pipe(browserSync.stream());
			});
		})(key);
	}

    // Watch bootstrap files
    gulp.watch('./app/blocks/**/*.less', ['bootstrap']);

    // Watch bower.json file
    gulp.watch('bower.json', ['bower']);
});



// CSS stream
gulp.task('css', function() {
	return gulp.src('./app/blocks/**/*.css')
    	.pipe(browserSync.stream());
});



// Bower wiredep
gulp.task('bower', function () {
	gulp.src('./app/*.html')
	.pipe(wiredep({
		directory : "app/bower_components"
	}))
	.pipe(gulp.dest('./app'));
});



// BUILD TASKS



// Clean
gulp.task('clean', function () {
	return gulp.src('dist', {read: false})
		.pipe(clean());
});



// Move
gulp.task('move', function() {
	gulp.src('./app/fonts/*')
	.pipe(gulp.dest('dist/fonts'));
});



// Imgmin
gulp.task('imgmin', function () {
	pages.map(function(page) {
		var files = glob.sync("./app/"+ page +"*"),
		 	block = '';

		files.map(function(file) {
	 		block = file.split('/').reverse()[0];

	 		gulp.src('./app/'+ page + block +'/*.{jpg,png,svg}')
	 		.pipe(imagemin({
	            progressive: true,
	            svgoPlugins: [{removeViewBox: false}],
	            use: [pngquant()]
	        }))
	        .pipe(gulp.dest('dist/images'));
		});
	});
});



// Css import
gulp.task('css-import', function() {
	pages.map(function(page) {
		var files = glob.sync("./app/"+ page +"*");

		gulp.src('./app/'+ page +'blocks.bundle.css')
		.pipe(importCss())
		.pipe(url({prepend: '../images/'}))
		.pipe(postcss([ autoprefixer({browsers: ['last 10 versions']}) ]))
		.pipe(gulp.dest('./app/'+ page));
	});
});



// Assets
gulp.task('assets', function () {
    var assets = useref.assets();
    
    return gulp.src('app/*.html')
        .pipe(assets)
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss({rebase: false})))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});



// Postcss



// RUN TASKS



// Default task
gulp.task('default', function(callback) {
	runSequence('bootstrap', 'clean-bundles', 'get-levels', 'css-bundles', 'js-bundles', 'browser-sync', callback);
});



// Build task
gulp.task('build', function(callback) {
	runSequence('bootstrap', 'clean-bundles', 'get-levels', 'css-bundles', 'js-bundles', 'clean', 'move', 'imgmin', 'css-import', 'assets', callback);
});