import * as esbuild from 'esbuild'

const settings = {
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es6',
    sourcemap: true, // Optional for debugging
    logLevel: 'info',
}

if (process.argv.includes('--watch')) {
    const context = await esbuild.context(settings)
    await context.watch()
    console.log('Watching for changes...')
} else {
    esbuild.build(settings)
}

