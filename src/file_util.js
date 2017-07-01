var fs = require('fs')
  , exec = require('child_process').exec
  , Promise = require('bluebird')
  ;


//// GLOBALS

var MAX_RETRY = 600;

var MAX_BUFFER_OPTS = {
   maxBuffer : 1024 * 1024 * 64
};
exports.MAX_BUFFER_OPTS = MAX_BUFFER_OPTS;

////

var promisedExec = function(command, options) {
  options = options || MAX_BUFFER_OPTS;

  return new Promise(function(resolve, reject) {
    console.log('About to exec: ', command);

    exec(command, options, function(err, out, code) {
      var output = {
        err: err
        , out: out
        , code: code
      };
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }
    });
  });
};
exports.promisedExec = promisedExec;

var writeBase64ToFile = function(data, filepath) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, data, 'base64', function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(filepath);
      }
    });
  });
};
exports.writeBase64ToFile = writeBase64ToFile;
