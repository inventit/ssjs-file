/*
 * JobServiceID:
 * urn:moat:${APPID}:file:fetch-file-result:1.0
 * 
 * Description: File Fetching Result Notification Function.
 * Reference: https://docs.google.com/a/yourinventit.com/document/d/1kdHxMp2VcZWcDnJ4YZqmW_aEYQt94ySrlityZQK2g6w/edit#heading=h.ql5gc3idrq72
 */
var moat = require('moat');
var context = moat.init();
var session = context.session;
var database = context.database;
var clientRequest = context.clientRequest;

session.log('fetch-file-result', 'Start File Fetching Result!');

// DownloadInfo should be returned
var objects = clientRequest.objects;
if (objects.length == 0) {
	session.log('Device sends wrong information.')
	throw "No FileResult object!";
}
var result = objects[0];
if (result.success == false) {
	// error!
	session.log('fetch-file-result', 'Failed to deliver '
		+ 'code:' + result.code + ', message:' + result.message);
	session.notifyAsync(result);
	// no further process
	return;
} else {
	session.log('fetch-file-result', 'OK! : ' + result.uid);
}

// Get dmjob arguments.
var args = clientRequest.dmjob.arguments;
session.log('fetch-file-result', 'args => ' + JSON.stringify(args));

var contents = args.contents;
var resultArray = [];
var p = args.p; // String
if (!p) {
	p = 1;
} else {
	// String to Integer
	p = parseInt(p);
	resultArray = args.resultArray;
}

// finish?
if (contents.length <= p) {
	session.notifyAsync(result);
	return;
}

// set the next index
session.setDmjobArgument('p', p + 1);
// save the current result
resultArray.push(result);
// to be translated into JSON stirng from Object
session.setDmjobArgument('resultArray', resultArray);

var uid = contents[p].uid;
var fileArray = database.querySharedByUids(
	'Content', [uid],
	['name','object'], ['put']);
if (fileArray.length == 0) {
	// The file is missing! Error!!!
	var message = "File with uid:" + uid + " is missing!";
	session.log('fetch-file-result', message);
	throw message;
}
var file = fileArray[0];

var contentInfoMapper = session.newModelMapperStub('ContentInfo');
var contentInfo = contentInfoMapper.newModelStub();
contentInfo.uploadUrl = file.object.put;
contentInfo.uid = uid;
contentInfo.name = file.name;
contentInfo.sourcePath = contents[p].localPath;
contentInfoMapper.update(contentInfo);
contentInfo.upload(session, null, {
	success: function(result) {
		// always assume async to receive the updateation result
		session.setWaitingForResultNotification(true);
		session.log('fetch-file-result', 'success!');
	},
	error: function(type, code) {
		session.log('fetch-file-result', 'error: type:' + type + ', code:' + code);
		contentInfo.errorInfo = {
			success: false,
			message: type,
			code: code
		};
		session.notifyAsync(contentInfo);
	}
}); // including commit()
