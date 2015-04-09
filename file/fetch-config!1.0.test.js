var nodeUnit = require('nodeunit');
var sinon = require('sinon');
var script = require('path').resolve('./fetch-config!1.0.js');
var moat = require('moat');

module.exports = nodeUnit.testCase({
  setUp: function(callback) {
	require.cache[script] = null;
	callback();
  },
  tearDown: function(callback) {
  	callback();
  },
  'file fetching, successful case.' : function(assert) {
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
			put: 'http://localhost/file1.name',
			type: 'my-type'
		}
	};
	database.querySharedByUids.withArgs(
		'Content', ['uid-1'],
		['name','object'], ['put']).returns([file]);

    var session = context.session;
    var configurationInfoMapper = session.newModelMapperStub('ConfigurationInfo');
	var configurationInfo = configurationInfoMapper.newModelStub();
	context.addCommand(configurationInfo, 'uploadConfig',
		context.newSuccessfulCommandEvent(true, null));

    // Run the script (replay state)
    require(script);

    // Assertion
    assert.equal(true, session.commit.called);
    assert.equal(true, session.setWaitingForResultNotification.withArgs(true).called);
    assert.equal('uid-1', configurationInfo.uid);
    assert.equal('http://localhost/file1.name', configurationInfo.uploadUrl);
	assert.equal(true, configurationInfoMapper.update.withArgs(configurationInfo).called);
	assert.equal(false, session.notifyAsync.called);
    assert.done();
  },

  'file fetching, error case.' : function(assert) {
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
			put: 'http://localhost/my-file.txt',
			type: 'my-type'
		}
	};
	database.querySharedByUids.withArgs(
		'Content', ['uid-1'],
		['name','object'], ['put']).returns([file]);

    var session = context.session;
    var configurationInfoMapper = session.newModelMapperStub('ConfigurationInfo');
	var configurationInfo = configurationInfoMapper.newModelStub();
	context.addCommand(configurationInfo, 'uploadConfig',
		context.newErrorCommandEvent('fatal_error', '-12345'));

    // Run the script (replay state)
    require(script);

    // Assertion
    assert.equal(true, session.commit.called);
    assert.equal(false, session.setWaitingForResultNotification.withArgs(true).called);
    assert.equal('uid-1', configurationInfo.uid);
    assert.equal('http://localhost/my-file.txt', configurationInfo.uploadUrl);
	assert.equal(true, configurationInfoMapper.update.withArgs(configurationInfo).called);
	assert.equal(true, session.notifyAsync.called);
    assert.done();
  }
});
