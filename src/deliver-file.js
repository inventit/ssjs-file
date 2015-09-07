/*
 * JobServiceID:
 * urn:moat:${APPID}:file:deliver-file:1.0
 * 
 * Description: File Delivery Function.
 * Reference: https://docs.google.com/a/yourinventit.com/document/d/1kdHxMp2VcZWcDnJ4YZqmW_aEYQt94ySrlityZQK2g6w/edit#heading=h.ql5gc3idrq72
 */

(function () {
  var moat = require('moat');
  var context = moat.init();
  var session = context.session;
  var database = context.database;
  var clientRequest = context.clientRequest;

  session.log('deliver-file', 'Start File Delivery!');

  // Get dmjob arguments.
  var args = clientRequest.dmjob.arguments;
  session.log('deliver-file', 'args => ' + JSON.stringify(args));

  var contents = args.contents;
  if (!contents) {
    (function () {
      var message = "Argument 'contents' is missing!";
      session.log('deliver-file', message);
      throw message;
    }());
  }

  if (contents.length === 0) {
    session.log('deliver-file', 'Empty contents. Cannot deliver it.');
    return;
  }

  var uid = contents[0].uid;
  var fileArray = database.querySharedByUids(
    'Content', [uid],
    ['name','object'], ['get']);
  if (fileArray.length === 0) {
    (function () {
      // The file is missing! Error!!!
      var message = "File with uid:" + uid + " is missing!";
      session.log('deliver-file', message);
      throw message;
    }());
  }
  var file = fileArray[0];
  
  var contentInfoMapper = session.newModelMapperStub('ContentInfo');
  var contentInfo = contentInfoMapper.newModelStub();
  contentInfo.deliveryUrl = file.object.get;
  contentInfo.uid = uid;
  contentInfo.name = file.name;
  contentInfo.destinationPath = contents[0].localPath;
  contentInfoMapper.update(contentInfo);
  contentInfo.download(session, null, {
    success: function(result) {
      // always assume async to receive the updateation result
      session.setWaitingForResultNotification(true);
      session.log('deliver-file', 'success!');
    },
    error: function(type, code) {
      session.log('deliver-file', 'error: type:' + type + ', code:' + code);
      session.notifyAsync({
        uid: uid,
        message: type,
        code: code
      });
    }
  }); // including commit()
}());
