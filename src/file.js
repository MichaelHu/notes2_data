var fs = require('fs');
var Path = require('path');
var assert = require('assert');

function fileContents(filePath) {
    var buf;

    try {
        buf = fs.readFileSync( filePath );
    } 
    catch (err) {
        return '';
    }

    return buf.toString('utf8');
}

function fileLines(filePath) {
    var content = fileContents(filePath);
    return content.split(/\r\n|\r|\n/);
}

function getFiles(path, options) {
    var files = fs.readdirSync(path);
    var ret = [];
    var opt  = options || {};

    files.forEach(function(value, index){
        var _path = path + Path.sep + value;
        var stat = fs.statSync(_path);

        if(stat.isDirectory()) {
            if(opt.recursive) {
                ret = ret.concat(getFiles(_path, opt));
            }
        }
        else if(stat.isFile()) {
            if(opt.fileFilter && !opt.fileFilter.test(_path)
                || opt.fileExcludes && opt.fileExcludes.test(_path)){
                return; 
            }
            ret.push(_path);
        }
    });

    return ret;
}

// console.log(fileContents('abc'));
// console.log(fileLines('abc'));
// console.log(files('.', {recursive: 1}));

// getFiles('/Users/hudamin/projects/git/mydocs/docs'
//     , {
//         recursive: 1
//         , fileFilter: /.*\.png$/
//     }
// ).forEach(function(file){
//     // console.log(file);
//     // console.log(fileContents(file));
//     // console.log(fileLines(file));
// });


exports.getFiles = getFiles;
exports.fileContents = fileContents;
exports.fileLines = fileLines;

