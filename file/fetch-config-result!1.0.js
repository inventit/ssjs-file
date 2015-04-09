/*
 * JobServiceID:
 * urn:moat:${APPID}:file:fetch-config-result:1.0
 * 
 * Description: Configuration File Fetching Result Notification Function.
 * Reference: https://docs.google.com/a/yourinventit.com/document/d/1kdHxMp2VcZWcDnJ4YZqmW_aEYQt94ySrlityZQK2g6w/edit#heading=h.ql5gc3idrq72
 */
var moat = require('moat');
var context = moat.init();
var session = context.session;
var database = context.database;
var clientRequest = context.clientRequest;

session.log('fetch-config-result', 'Start Config Fetching Result!');

// DownloadInfo should be returned
var objects = clientRequest.objects;
if (objects.length == 0) {
	session.log('Device sends wrong information.')
	throw "No FileResult object!";
}
var result = objects[0];
if (result.success == false) {
	// error!
	session.log('fetch-config-result', 'Failed to deliver uid:'
		+ result.uid + ', code:' + result.code + ', message:' + result.message);
} else {
	session.log('fetch-config-result', 'OK! : ' + result.uid);
}

session.notifyAsync(result);
