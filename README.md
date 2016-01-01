# janus-transaction
Janus-Transaction lets you utilizes Caolan's ```async``` to perform asynchronous transactional rollbacks.

This operates like a a normal ```async.waterfall``` process until an error occurs and then each step of the waterfall will be reversed via custom rollback methods.

## Installation

``npm install janus-transaction``

## API

### add(task, rollback)

**task** is the function that is called during the transaction processing.  The callback to the next step of the transaction is always at the end of the task's parameters.  Passing arguments into this callback will populate the next task's parameters.  If the first parameter of this callback is populated with a non-falsy value, then the rollback process will begin.

**rollback** is function that is called when a task fails.  The parameters of this function are populated with the arguments that were passed into the subsequent task.  If the first parameter of this callback is populated with a non-falsy value, then the rollback process will prematurely finish.

This function returns the transaction object for a fluent interface.

### exec(tasksFinished, rollbacksFinished)

**tasksFinished** is called when the tasks chains are successfully executed.  The parameter will be populated with the second argument that was passed into the last task's next step callback.

**rollbacksFinished** is called when the rollback chains are successfully executed.  The first parameter contains the original error that triggered the rollbacks.  The second parameter contains any errors that happened during the rollback chain.  The third parameter contains the second argument that was passed into the last rollback' next step callback.

## Examples

### High-Level Comprehensive Case

```javascript
new Transaction().
  add(function(next) {
    // Task
    console.log('Perform Task A');
    next(null, 7);
  }, function(taskAResult, next) {
    // Rollback
    console.log('Task B failed, so perform rollback of Task A ( With the results from Task A:', taskAResult, ')');
    next();
  }).
  add(function(taskAResult, next) {
    // Task
    console.log('Perform Task B');
    next('Error time! Release the rollbacks!');
  }, function(res, taskBResult) {
    // Rollback
    console.log('Currently, the last rollback of a Janus-Transaction never fires :X', taskBResult);
    next();
  }).exec(function(transactionResults) {
    // Final transaction handler
    console.log('The transaction is not a success, so this never prints and, technically, is not needed');
    console.log(transactionResults);
  }, function(originalErr, rollbackErr, rollbackResults) {
    // Final rollback handler
    console.log('This example errors out and passes the original error through:');
    console.error(originalErr);
  });
```

### Common Use Case

```javascript

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
    console.log(value);   // Will print 6
  }, function(originalErr, rollbackErr, rollbackResults) {
    // Final rollback handler
    console.log(value);   // Will not print
  });
```

### Rollback Use Case

```javascript
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
    console.log(value);   // Will not print
  }, function(originalErr, rollbackErr, rollbackResults) {
    // Final rollback handler
    console.log(value);   // Will print 1
  });
```