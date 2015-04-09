var nodeUnit = require('nodeunit');
var sinon = require('sinon');
var script = require('path').resolve('./deliver-config!1.0.js');
var moat = require('moat');

module.exports = nodeUnit.testCase({
  setUp: function(callback) {
	require.cache[script] = null;
	callback();
  },
  tearDown: function(callback) {
  	callback();
  },
  'configuration file delivery, successful case.' : function(assert) {
	// record state
    var context = moat.init(sinon);
    var arguments = {
        contents: [
			{
            	uid: "uid-1",
            	localPath: "/path/to/uid-1.file"
        	},
			{
            	uid: "uid-2",
            	localPath: "/path/to/uid-2.file"
        	}
		]
    };
    context.setDevice('uid', 'deviceId', 'name', 'status', 'clientVersion', 0);
    context.setDmjob('uid', 'deviceId', 'name', 'status', 'jobServiceId',
			'sessionId', arguments, 'createdAt', 'activatedAt', 'startedAt',
			'expiredAt', 'http', 'http://localhost');
	var database = context.database;
	var file = {
		name: 'file1',
		object: {
			get: 'http://localhost/file1.name',
			type: 'my-type'
		}
	};
	database.querySharedByUids.withArgs(
		'Content', ['uid-1'],
		['name','object'], ['get']).returns([file]);

    var session = context.session;
    var configurationInfoMapper = session.newModelMapperStub('ConfigurationInfo');
	var configurationInfo = configurationInfoMapper.newModelStub();
	context.addCommand(configurationInfo, 'downloadAndApply',
		context.newSuccessfulCommandEvent(true, null));

    // Run the script (replay state)
    require(script);

    // Assertion
    assert.equal(true, session.commit.called);
    assert.equal(true, session.setWaitingForResultNotification.withArgs(true).called);
    assert.equal('uid-1', configurationInfo.uid);
    assert.equal('http://localhost/file1.name', configurationInfo.deliveryUrl);
	assert.equal(true, configurationInfoMapper.update.withArgs(configurationInfo).called);
	assert.equal(false, session.notifyAsync.called);
    assert.done();
  },

  'configuration file delivery, error case.' : function(assert) {
	// record state
    var context = moat.init(sinon);
    var arguments = {
        contents: [
			{
            	uid: "uid-1",
            	localPath: "/path/to/uid-1.file"
        	},
			{
            	uid: "uid-2",
            	localPath: "/path/to/uid-2.file"
        	}
		]
    };
    context.setDevice('uid', 'deviceId', 'name', 'status', 'clientVersion', 0);
    context.setDmjob('uid', 'deviceId', 'name', 'status', 'jobServiceId',
			'sessionId', arguments, 'createdAt', 'activatedAt', 'startedAt',
			'expiredAt', 'http', 'http://localhost');
	var database = context.database;
	var file = {
		name: 'my-file',
		object: {
			get: 'http://localhost/my-file.txt',
			type: 'my-type'
		}
	};
	database.querySharedByUids.withArgs(
		'Content', ['uid-1'],
		['name','object'], ['get']).returns([file]);

    var session = context.session;
    var configurationInfoMapper = session.newModelMapperStub('ConfigurationInfo');
	var configurationInfo = configurationInfoMapper.newModelStub();
	context.addCommand(configurationInfo, 'downloadAndApply',
		context.newErrorCommandEvent('fatal_error', '12345'));

    // Run the script (replay state)
    require(script);

    // Assertion
    assert.equal(true, session.commit.called);
    assert.equal(false, session.setWaitingForResultNotification.withArgs(true).called);
    assert.equal('uid-1', configurationInfo.uid);
    assert.equal('http://localhost/my-file.txt', configurationInfo.deliveryUrl);
	assert.equal(true, configurationInfoMapper.update.withArgs(configurationInfo).called);
	assert.equal(true, session.notifyAsync.called);
    assert.done();
  }
});
