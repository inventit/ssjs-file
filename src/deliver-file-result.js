/*
 * JobServiceID:
 * urn:moat:${APPID}:file:deliver-file-result:1.0
 * 
 * Description: File Delivery Result Notification Function.
 * Reference: https://docs.google.com/a/yourinventit.com/document/d/1kdHxMp2VcZWcDnJ4YZqmW_aEYQt94ySrlityZQK2g6w/edit#heading=h.ql5gc3idrq72
 */

(function () {
  var moat = require('moat');
  var context = moat.init();
  var session = context.session;
  var database = context.database;
  var clientRequest = context.clientRequest;

  session.log('deliver-file-result', 'Start File Delivery Result!');

  // DownloadInfo should be returned
  var objects = clientRequest.objects;
  if (objects.length === 0) {
    session.log('Device sends wrong information.');
    throw "No FileResult object!";
  }
  var result = objects[0];
  if (result.success === false) {
    // error!
    session.log('deliver-file-result', 'Failed to deliver uid:' + result.uid + ', code:' + result.code + ', message:' + result.message);
    session.notifyAsync(result);
    // no further process
    return;
  } else {
    session.log('deliver-file-result', 'OK! : ' + result.uid);
  }

  // Get dmjob arguments.
  var args = clientRequest.dmjob.arguments;
  session.log('deliver-file-result', 'args => ' + JSON.stringify(args));

  var contents = JSON.parse(args.contents);
  var resultArray = [];
  var p = args.p; // String
  if (!p) {
    p = 1;
  } else {
    // String to Integer
    p = parseInt(p);
    // JSON String to Object
    resultArray = JSON.parse(args.resultArray);
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
    ['name','object'], ['get']);
  if (fileArray.length === 0) {
    // The file is missing! Error!!!
    var message = "Content with uid:" + uid + " is missing!";
    session.log('deliver-file-result', message);
    throw message;
  }
  var file = fileArray[0];

  var contentInfoMapper = session.newModelMapperStub('ContentInfo');
  var contentInfo = contentInfoMapper.newModelStub();
  contentInfo.deliveryUrl = file.object.get;
  contentInfo.uid = uid;
  contentInfo.name = file.name;
  contentInfo.destinationPath = contents[p].localPath;
  contentInfoMapper.update(contentInfo);
  contentInfo.download(session, null, {
    success: function(result) {
      // always assume async to receive the updateation result
      session.setWaitingForResultNotification(true);
      session.log('deliver-file-result', 'success!');
    },
    error: function(type, code) {
      session.log('deliver-file-result', 'error: type:' + type + ', code:' + code);
      contentInfo.errorInfo = {
        success: false,
        message: type,
        code: code
      };
      session.notifyAsync(contentInfo);
    }
  }); // including commit()
}());
