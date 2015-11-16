var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
var SvnClient = require('svn-spawn');
var File = require('./file.js');
var program = require('commander');


program.version('0.0.1')
    .usage('[options] <docroot>')
    // .option('-R, --docroot <root>', 'Document root directory')
    .option('--dburl <dburl>', 'URL to MongoDB')
    .parse(process.argv);

if(!program.args.length) {
    program.outputHelp();
    process.exit(0);
}

var docRoot = program.args[0],
    dbURL = program.dburl;

console.log('Start inserting');
doInsert(docRoot);
console.log('Finish inserting');




function doInsert(docRoot) {

    // Connection URL
    var url = dbURL || 'mongodb://localhost:27017/notes2';

    console.log("Start connecting to server");
    // Use connect method to connect to the Server
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        console.log("Connected correctly to server");

        // Do insertion
        insertDocuments(db, docRoot, function(){
            db.close();
            console.log("Close connection to server");
        });
    });

}


function insertDocuments(db, docRoot, callback) {
    var t_lines = db.collection('t_lines');
    var t_notes = db.collection('t_notes');

    var svn = new SvnClient({
        cwd: docRoot
    });

    var count = 1, fileId = 1;

    console.log('Inserting documents ...');

    t_lines.drop();
    t_notes.drop();

    var files = File.getFiles(
        docRoot
        , {
            fileFilter: /.*\.md$/
            , fileExcludes: /\/(?:bower_components|node_modules)\//
            , recursive: 1
        }
    );
    var _cnt = 0;

    files.forEach(function(file){
        console.log(file);
        var lines = File.fileLines(file);
        var isFirstLine = true;
        var date = new Date();

        lines.forEach(function(line){
            if(isFirstLine) {
                t_notes.insert({
                    note_id: fileId
                    , file_name: file
                    , title: line
                });
                isFirstLine = false;
            }
            t_lines.insert({note_id: fileId, lineno: count++, text: line});
        });

        fileId++;

    });

    files.forEach(function(file){

        svn.getLog(file, function(err, data){
            var dateStr = data && ( 
                    data[0] && data[0].date 
                    || data[0] && data[0][0] && data[0][0].date 
                );
            dateStr = Date.parse(dateStr);
            t_notes.update(
                { file_name: file }
                , {
                    $set: {
                        modified_time: dateStr
                        , author: /\/docroot\/+([^\/]+)/.test(file)
                            ? RegExp.$1 : ''
                    }
                }
            ); 
            _cnt++;
            if(_cnt == files.length) {
                callback();
            }
        });

    });


}
