var async = require('async');

/**
 * Defines a Janus-Transaction.  This operates like a conditional inversion of Caolan's async.waterfall, where the waterfall will proceed as normally until an error and then each step of the waterfall will be reversed via custom rollback methods.
 * @public
 */
function Transaction() {
  this.count = 0;
  this.tasks = [];
  this.rollbacks = [];
  this.args = [];
}

/**
 * Increments where in the waterfall the task execution is.
 * @private
 */
Transaction.prototype.increment = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  this.args[this.count] = args.slice(0, args.length - 2);
  args.unshift(null);
  this.count += 1;
  return args[args.length - 2].apply(args[args.length - 1], args.slice(0, args.length - 2));
};

/**
 * Adds a task and its rollback to the transaction
 * @public
 * @param   Function    Task to perform.
 * @param   Function    Rollback to execute in case the next task fails.
 * @return  Object      Returns Transaction object for chaining.
 */
Transaction.prototype.add = function(task, rollback) {
  var self = this;
  this.tasks.push(task);
  this.tasks.push(function() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.push(this);
    self.increment.apply(self, args);
  });
  this.rollbacks.push(rollback);
  return this;
};

/**
 * Executes the transaction.
 * @public
 * @param   Function    Callback to fire when all transactions successfully complete.
 * @param   Function    Callback to fire when all rollbacks successfully complete.
 */
Transaction.prototype.exec = function(success, error) {
  var self = this;
  async.waterfall(this.tasks, function(err) {
    if(err) {
      // Perform all rollbacks
      var tasks = [];
      for(var i = self.count, len = -1; i >len; i--) {
        if(i % 2 === 0) {
          (function(index) {
            tasks.push(function(next) {
              var args = self.args[index];
              args.push(next);
              self.rollbacks[index].apply(async, args);
            });
          })(i);
        }
      }

      // Run all rollbacks
      async.waterfall(tasks, function(err, results) {
        if(err) {
          return error(err);
        }
        return error(results);
      });
    } else {
      success.apply(this, Array.prototype.slice.call(arguments, 1));
    }
  });
};

module.exports = Transaction;
