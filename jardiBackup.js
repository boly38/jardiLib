const path = require('path')
var mongoTools = require("node-mongotools");

/**
 * pick filename only from full file+path string
 */
function filenameOnly(fullName) {
    return fullName ? fullName.substring(fullName.lastIndexOf(path.sep) + 1, fullName.length) : '';
}
/**
 * help user on usage
 */
function printUsage() {
  var launchCmd = filenameOnly(process.argv[0]) + ' ' + filenameOnly(process.argv[1]);
  console.log('Usage:\t' + launchCmd + ' <dump|dumpContrib|restore backup/myFile.gz>');
}

function onActionSuccess(success) {
  console.info(success.message);
  if (success.stdout) { console.info('stdout:', success.stdout); }
  if (success.stderr) { console.error('stderr:', success.stderr); }
}

function onActionError(error) {
  console.error(error.message ? error.message : error);
}

var jardiUri = process.env.JARDI_MONGO_URI;
if (typeof jardiUri == 'string' && jardiUri.includes('?')) {
  jardiUri = jardiUri.split('?')[0];
} else {
  throw 'JARDI_MONGO_URI required';
}
var jardiUri = process.env.JARDI_MONGO_URI;
var jardiAdminUri = null
if (process.env.JARDI_ADMIN_MONGO_DB_NAME && typeof jardiUri == 'string' && jardiUri.includes('mongodb.net/')) {
  jardiAdminUri = jardiUri.substring(0, jardiUri.lastIndexOf('/')) + '/' + process.env.JARDI_ADMIN_MONGO_DB_NAME;
}

// take first command line argument
var action = process.argv.slice(2)[0];

if (action == 'dump') {
  console.info("dump via jardiUri", jardiUri);
  var options  = {};
  options.uri  = jardiUri;
  options.path = 'backup';
  mongoTools.mongodump(options).then(onActionSuccess).catch(onActionError);
}

else if (action == 'dumpContrib') {
  console.info("dump via jardiAdminUri", jardiAdminUri);
  var options  = {};
  options.uri  = jardiAdminUri;
  options.path = 'backup';
  mongoTools.mongodump(options).then(onActionSuccess).catch(onActionError);
}

// restore action do need an extra argument: the file to restore
else if ((action == 'restore') && (process.argv.slice(2).length > 1)) {
  var restoreFile = process.argv.slice(2)[1];
  var options = {};
  options.uri  = !jardiUri.includes('/') ? jardiUri : jardiUri.substring(0, jardiUri.lastIndexOf('/'));
  options.dumpPath = restoreFile;
  options.dropBeforeRestore = true;
  options.deleteDumpAfterRestore = false;
  mongoTools.mongorestore(options).then(onActionSuccess).catch(onActionError);
} else {
  printUsage();
}