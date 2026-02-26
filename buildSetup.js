import path from 'path'
import fs from 'fs'

export async function preBuild(context) {
    let {build, config, paths, watcher} = context

    // build the worker script and save it as a txt file to be loaded by the speaker class for final build
    config = {...config}
    config.entryPoints = [path.join(paths.SRC_PATH, './js/speech/speaker-worker.js')]
    config.minify = true
    config.sourcemap = false

    let out = await build(config)
    let scripts = out.outputFiles.map(({ text }) => text).join("\n")

    let outPath = path.join(paths.SRC_PATH, './js/speech/speaker-worker.js.txt')
    if(watcher) await watcher.unwatch(outPath);
    fs.writeFileSync(outPath, scripts, 'utf8')
}