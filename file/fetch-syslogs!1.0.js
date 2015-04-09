/*
 * JobServiceID:
 * urn:moat:${APPID}:file:fetch-syslogs:1.0
 * 
 * Description: Syslog File Fetching Function.
 * Reference: https://docs.google.com/a/yourinventit.com/document/d/1kdHxMp2VcZWcDnJ4YZqmW_aEYQt94ySrlityZQK2g6w/edit#heading=h.ql5gc3idrq72
 */
var moat = require('moat');
var context = moat.init();
var session = context.session;
var database = context.database;
var clientRequest = context.clientRequest;

session.log('fetch-syslog', 'Start Syslogs Fetching!');

// Get dmjob arguments.
var args = clientRequest.dmjob.arguments;
session.log('fetch-syslog', 'args => ' + JSON.stringify(args));

var syslog = args.syslog;
if (!syslog) {
	var message = "Argument 'syslog' is missing!";
	session.log('fetch-syslog', message);
	throw message;
}

if (!syslog.uid) {
	var message = 'Invalid parameter. Cannot deliver it.';
	session.log('fetch-syslog', message);
	throw message;
}

var uid = syslog.uid;
var fileArray = database.querySharedByUids(
	'Content', [uid],
	['name','object'], ['put']);
if (fileArray.length == 0) {
	// The file is missing! Error!!!
	var message = "File with uid:" + uid + " is missing!";
	session.log('fetch-syslog', message);
	throw message;
}
var file = fileArray[0];

var syslogInfoMapper = session.newModelMapperStub('SyslogInfo');
var syslogInfo = syslogInfoMapper.newModelStub();
syslogInfo.uploadUrl = file.object.put;
syslogInfo.uid = uid;
syslogInfo.maxLogs = 1;
if (syslog.maxLogs) {
	syslogInfo.maxLogs = syslog.maxLogs;
}
syslogInfoMapper.update(syslogInfo);
syslogInfo.upload(session, null, {
	success: function(result) {
		// always assume async to receive the updateation result
		session.setWaitingForResultNotification(true);
		session.log('fetch-syslog', 'success!');
	},
	error: function(type, code) {
		session.log('fetch-syslog', 'error: message:' + type + ', code:' + code);
		session.notifyAsync({
			uid: uid,
			message: type,
			code: code
		});
	}
}); // including commit()
