const gulp = require('gulp');
const shell = require('gulp-shell');
const copy = require('gulp-copy');

gulp.task('spack', shell.task('npx spack'));

gulp.task('copy-images', () => {
    return gulp.src([
        'res/queenbee_normal.jpg',
        'res/soldierant_normal.jpg',
        'res/spider_normal.jpg',
        'res/grasshopper_normal.jpg',
        'res/beetle_normal.jpg',
        'res/ladybug_normal.jpg',
        'res/mosquito_normal.jpg',
        'res/queenbee.svg',
        'res/soldierant.svg',
        'res/spider.svg',
        'res/grasshopper.svg',
        'res/beetle.svg',
        'res/ladybug.svg',
        'res/mosquito.svg',
        'res/tile.glb',
        'res/tile_basic.glb',
    ], { encoding: false })
        .pipe(gulp.dest('dist/res'));
});

gulp.task('copy-static-files', () => {
    return gulp.src([
        'src/index.html',
        'src/styles.css',
    ])
        .pipe(gulp.dest('dist'));
});

gulp.task('default', gulp.series('spack', 'copy-images', 'copy-static-files'));

