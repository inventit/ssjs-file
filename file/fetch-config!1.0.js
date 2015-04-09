/*
 * JobServiceID:
 * urn:moat:${APPID}:file:fetch-config:1.0
 * 
 * Description: Configuration File Fetching Function.
 * Reference: https://docs.google.com/a/yourinventit.com/document/d/1kdHxMp2VcZWcDnJ4YZqmW_aEYQt94ySrlityZQK2g6w/edit#heading=h.ql5gc3idrq72
 */
var moat = require('moat');
var context = moat.init();
var session = context.session;
var database = context.database;
var clientRequest = context.clientRequest;

session.log('fetch-config', 'Start Config Fetching!');

// Get dmjob arguments.
var args = clientRequest.dmjob.arguments;
session.log('fetch-config', 'args => ' + JSON.stringify(args));

var contents = args.contents;
if (!contents) {
	var message = "Argument 'contents' is missing!";
	session.log('fetch-config', message);
	throw message;
}

if (contents.length == 0) {
	session.log('fetch-config', 'Empty contents. Cannot deliver it.');
	return;
}

var uid = contents[0].uid;
var fileArray = database.querySharedByUids(
	'Content', [uid],
	['name','object'], ['put']);
if (fileArray.length == 0) {
	// The file is missing! Error!!!
	var message = "File with uid:" + uid + " is missing!";
	session.log('fetch-config', message);
	throw message;
}
var file = fileArray[0];

var configurationInfoMapper = session.newModelMapperStub('ConfigurationInfo');
var configurationInfo = configurationInfoMapper.newModelStub();
configurationInfo.uid = uid;
configurationInfo.uploadUrl = file.object.put;
configurationInfo.sourcePath = contents[0].localPath;
configurationInfoMapper.update(configurationInfo);
configurationInfo.uploadConfig(session, null, {
	success: function(result) {
		// always assume async to receive the updateation result
		session.setWaitingForResultNotification(true);
		session.log('fetch-config', 'success!');
	},
	error: function(type, code) {
		session.log('fetch-config', 'error: message:' + type + ', code:' + code);
		session.notifyAsync({
			uid: uid,
			message: type,
			code: code
		});
	}
}); // including commit()
