var assert = require('assert');
var async = require('async');
var Transaction = require('./index');

function fail(message) {
  throw new Error(message || 'Should not be here');
}

async.series([
  
  // Testing Readme Example
  function(done) {
    new Transaction().
      add(function(next) {
        // Task
        next(null, 7);
      }, function(taskAResult, next) {
        // Rollback
        assert.equal(taskAResult, 7);
        next();
      }).
      add(function(taskAResult, next) {
        // Task
        next('Error time! Release the rollbacks!');
      }, function(res, taskBResult) {
        // Rollback
        fail();
      }).exec(function(transactionResults) {
        // Final transaction handler
        fail();
      }, function(originalErr, rollbackErr, rollbackResults) {
        // Final rollback handler
        assert.equal(originalErr, 'Error time! Release the rollbacks!');
        assert.equal(rollbackErr, null);
        assert.equal(rollbackResults, null);
        done();
      });
  }, 

  // Simple pass
  function(done) {
    new Transaction().
      add(function(next) {
        // Task
        next(null, 7);
      }, function(taskAResult, next) {
        // Rollback
        fail();
      }).exec(function(transactionResults) {
        // Final transaction handler
        assert.equal(transactionResults, 7);
        done();
      }, function(originalErr, rollbackErr, rollbackResults) {
        // Final rollback handler
        fail();
      });
  }, 

  // Long Pass
  function(done) {
    new Transaction().
      add(function(next) {
        // Task
        next(null, 7);
      }, function(value, next) {
        // Rollback
        fail();
      }).
      add(function(value, next) {
        // Task
        assert.equal(value, 7);
        next(null, 8);
      }, function(value, next) {
        // Rollback
        fail();
      }).
      add(function(value, next) {
        // Task
        assert.strictEqual(value, 8);
        next(null, 9);
      }, function(value, next) {
        // Rollback
        fail();
      }).
      add(function(value, next) {
        // Task
        assert.strictEqual(value, 9);
        next(null, 10);
      }).exec(function(value) {
        // Final transaction handler
        assert.strictEqual(value, 10);
        done();
      }, function(originalErr, rollbackErr, rollbackResults) {
        // Final rollback handler
        fail();
      });
  }, 

  // Simple Fail
  function(done) {
    new Transaction().
      add(function(next) {
        // Task
        next(true);
      }, function(value, next) {
        // Rollback
        fail();
      }).exec(function(transactionResults) {
        // Final transaction handler
        fail();
      }, function(originalErr, rollbackErr, rollbackResults) {
        // Final rollback handler
        assert.strictEqual(originalErr, true);
        assert.strictEqual(rollbackErr, undefined);
        assert.strictEqual(rollbackResults, undefined);
        done();
      });
  }, 

  // Long Fail
  function(done) {
    new Transaction().
      add(function(next) {
        // Task
        next(null, 7);
      }, function(value, next) {
        // Rollback
        assert.strictEqual(value, 7);
        next();
      }).
      add(function(value, next) {
        // Task
        assert.equal(value, 7);
        next(null, 8);
      }, function(value, next) {
        // Rollback
        assert.strictEqual(value, 8);
        next();
      }).
      add(function(value, next) {
        // Task
        assert.strictEqual(value, 8);
        next(null, 9);
      }, function(value, next) {
        // Rollback
        assert.strictEqual(value, 9);
        next();
      }).
      add(function(value, next) {
        // Task
        assert.strictEqual(value, 9);
        next(true);
      }).exec(function(value) {
        // Final transaction handler
        fail();
      }, function(originalErr, rollbackErr, rollbackResults) {
        // Final rollback handler
        assert.strictEqual(originalErr, true);
        assert.strictEqual(rollbackErr, undefined);
        assert.strictEqual(rollbackResults, undefined);
        done();
      });
  }, 

  // Making sure final rollback can be missing 
  function(done) {
    new Transaction().
      add(function(next) {
        // Task
        next(null, 7);
      }, function(value, next) {
        // Rollback
        assert.strictEqual(value, 7);
        next(null, 'rollback worked');
      }).
      add(function(value, next) {
        // Task
        assert.equal(value, 7);
        next(null, 8);
      }, function(value, next) {
        // Rollback
        assert.strictEqual(value, 8);
        next();
      }).
      add(function(value, next) {
        // Task
        assert.strictEqual(value, 8);
        next(null, 9);
      }, function(value, next) {
        // Rollback
        assert.strictEqual(value, 9);
        next();
      }).
      add(function(value, next) {
        // Task
        assert.strictEqual(value, 9);
        next(true);
      }).exec(function(value) {
        // Final transaction handler
        fail();
      }, function(originalErr, rollbackErr, rollbackResults) {
        // Final rollback handler
        assert.strictEqual(originalErr, true);
        assert.strictEqual(rollbackErr, null);
        assert.strictEqual(rollbackResults, 'rollback worked');
        done();
      });
  },

  // Making sure rollback error happens
  function(done) {
    new Transaction().
      add(function(next) {
        // Task
        next(null, 7);
      }, function(value, next) {
        // Rollback
        fail();
      }).
      add(function(value, next) {
        // Task
        assert.equal(value, 7);
        next(null, 8);
      }, function(value, next) {
        // Rollback
        fail();
      }).
      add(function(value, next) {
        // Task
        assert.strictEqual(value, 8);
        next(null, 9);
      }, function(value, next) {
        // Rollback
        assert.strictEqual(value, 9);
        next('fail');
      }).
      add(function(value, next) {
        // Task
        assert.strictEqual(value, 9);
        next(true);
      }).exec(function(value) {
        // Final transaction handler
        fail();
      }, function(originalErr, rollbackErr, rollbackResults) {
        // Final rollback handler
        assert.strictEqual(originalErr, true);
        assert.strictEqual(rollbackErr, 'fail');
        assert.strictEqual(rollbackResults, undefined);
        done();
      });
  },

  // README test #2
  function(done) {
    var value = 0;

    new Transaction().
      add(function(next) {
        // Task
        value += 1;
        next();
      }, function(next) {
        // Rollback
        value += 2;
        next();
      }).
      add(function(next) {
        // Task
        value += 2;
        next();
      }, function(next) {
        // Rollback
        value -= 3;
        next();
      }).
      add(function(next) {
        // Task
        value += 3;
        next();
      }).exec(function() {
        // Final transaction handler
        assert.strictEqual(value, 6);
      }, function(originalErr, rollbackErr, rollbackResults) {
        // Final rollback handler
        fail();
      }); 
  },

  // README test #3
  function(done) {
    var value = 0;

    new Transaction().
      add(function(next) {
        // Task
        value += 1;
        next();
      }, function(next) {
        // Rollback
        value += 2;
        next();
      }).
      add(function(next) {
        // Task
        value += 2;
        next();
      }, function(next) {
        // Rollback
        value -= 3;
        next();
      }).
      add(function(next) {
        // Task
        value += 3;
        next(true);
      }).exec(function() {
        // Final transaction handler
        fail();
      }, function(originalErr, rollbackErr, rollbackResults) {
        // Final rollback handler
        assert.strictEqual(value, 1);
        done();
      }); 
  }

], function(err, results) {
  if(err) {
    throw new Error(err);
  } else {
    console.log('Tests are finished!');
  }
});