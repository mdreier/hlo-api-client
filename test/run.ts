import jasmine from './jasmine.js'
import fs from 'fs-extra'

loadHelpers().then(loadSpecs).then(() => jasmine.execute()).catch(console.log);

async function loadHelpers(): Promise<any> {
    return importFiles('spec/helpers', '.ts');
}

async function loadSpecs(): Promise<any> {
    return importFiles('spec', '.spec.ts');
}

function replaceFileEnding(tsFile: string): string {
    let dotPos = tsFile.lastIndexOf('.');
    return dotPos < 0 ? tsFile : tsFile.substr(0, dotPos) + '.js';
}

async function importFiles(folder: string, extension: string): Promise<any> {
    return fs.readdir('./' + folder)                                    //Relative to project directory
            .then(files => Promise.all(
                files
                    .filter(file => file.endsWith(extension))           //Filter for file extension
                    .map(replaceFileEnding)                             //Import must be done with .js extension for node-ts
                    .map(file => import(`../${folder}/${file}`))
            ));
}