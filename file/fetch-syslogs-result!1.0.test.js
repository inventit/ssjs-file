var nodeUnit = require('nodeunit');
var sinon = require('sinon');
var script = require('path').resolve('./fetch-syslogs-result!1.0.js');
var moat = require('moat');

module.exports = nodeUnit.testCase({
  setUp: function(callback) {
	require.cache[script] = null;
	callback();
  },
  tearDown: function(callback) {
  	callback();
  },
  'config fetching result, successful case.' : function(assert) {
	// record state
    var context = moat.init(sinon);
    var arguments = {
        contents: [
			{
            	uid: "uid-1",
				maxLogs: 5
        	}
		]
    };
    context.setDevice('uid', 'deviceId', 'name', 'status', 'clientVersion', 0);
    context.setDmjob('uid', 'deviceId', 'name', 'status', 'jobServiceId',
			'sessionId', arguments, 'createdAt', 'activatedAt', 'startedAt',
			'expiredAt', 'http', 'http://localhost');
	// see https://docs.google.com/a/yourinventit.com/document/d/1kdHxMp2VcZWcDnJ4YZqmW_aEYQt94ySrlityZQK2g6w/edit#heading=h.qznmwoavtwsw
	context.setObjects([{
		success: true,
		code: '200',
		message: null
	}]);
    var session = context.session;

    // Run the script (replay state)
    require(script);

    // Assertion
    assert.equal(false, session.commit.called);
    assert.equal(false, session.setWaitingForResultNotification.withArgs(true).called);
	assert.equal(true, session.notifyAsync.calledOnce);
    assert.done();
  },

  'config fetching result, error case.' : function(assert) {
	// record state
    var context = moat.init(sinon);
    var arguments = {
        contents: [
			{
            	uid: "uid-1",
				maxLogs: 5
        	}
		]
    };
    context.setDevice('uid', 'deviceId', 'name', 'status', 'clientVersion', 0);
    context.setDmjob('uid', 'deviceId', 'name', 'status', 'jobServiceId',
			'sessionId', arguments, 'createdAt', 'activatedAt', 'startedAt',
			'expiredAt', 'http', 'http://localhost');
	// see https://docs.google.com/a/yourinventit.com/document/d/1kdHxMp2VcZWcDnJ4YZqmW_aEYQt94ySrlityZQK2g6w/edit#heading=h.qznmwoavtwsw
	var resultContentInfo = {
		success: false,
		code: '403',
		message: 'Invalid Credentials'
	};
	context.setObjects([resultContentInfo]);
    var session = context.session;

    // Run the script (replay state)
    require(script);

    // Assertion
    assert.equal(false, session.commit.called);
    assert.equal(false, session.setWaitingForResultNotification.withArgs(true).called);
	assert.equal(true, session.notifyAsync.withArgs(resultContentInfo).calledOnce);
    assert.done();
  },

});
