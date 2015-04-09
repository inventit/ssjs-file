var nodeUnit = require('nodeunit');
var sinon = require('sinon');
var script = require('path').resolve('./fetch-syslogs!1.0.js');
var moat = require('moat');

module.exports = nodeUnit.testCase({
  setUp: function(callback) {
	require.cache[script] = null;
	callback();
  },
  tearDown: function(callback) {
  	callback();
  },
  'syslogs fetching, successful case.' : function(assert) {
	// record state
    var context = moat.init(sinon);
    var arguments = {
        syslog: 
			{
            	uid: "uid-1",
            	maxLogs: 12
        	}
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
    var syslogInfoMapper = session.newModelMapperStub('SyslogInfo');
	var syslogInfo = syslogInfoMapper.newModelStub();
	context.addCommand(syslogInfo, 'upload',
		context.newSuccessfulCommandEvent(true, null));

    // Run the script (replay state)
    require(script);

    // Assertion
    assert.equal(true, session.commit.called);
    assert.equal(true, session.setWaitingForResultNotification.withArgs(true).called);
    assert.equal('uid-1', syslogInfo.uid);
    assert.equal('http://localhost/file1.name', syslogInfo.uploadUrl);
	assert.equal(true, syslogInfoMapper.update.withArgs(syslogInfo).called);
	assert.equal(false, session.notifyAsync.called);
    assert.done();
  },

  'syslogs fetching, error case.' : function(assert) {
	// record state
    var context = moat.init(sinon);
    var arguments = {
        syslog:
			{
            	uid: "uid-1",
            	maxLogs: 5
        	}
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
    var syslogInfoMapper = session.newModelMapperStub('SyslogInfo');
	var syslogInfo = syslogInfoMapper.newModelStub();
	context.addCommand(syslogInfo, 'upload',
		context.newErrorCommandEvent('fatal_error', '-12345'));

    // Run the script (replay state)
    require(script);

    // Assertion
    assert.equal(true, session.commit.called);
    assert.equal(false, session.setWaitingForResultNotification.withArgs(true).called);
    assert.equal('uid-1', syslogInfo.uid);
    assert.equal('http://localhost/my-file.txt', syslogInfo.uploadUrl);
	assert.equal(true, syslogInfoMapper.update.withArgs(syslogInfo).called);
	assert.equal(true, session.notifyAsync.called);
    assert.done();
  }
});
