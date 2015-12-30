# janus-transaction
Using caolan's async to perform asynchronous transactional rollbacks.

This operates like a conditional inversion of Caolan's async.waterfall, where the waterfall will proceed as normally until an error and then each step of the waterfall will be reversed via custom rollback methods.

## Example

```javascript
new Transaction().
  add(function(next) {
    // Task
    console.log('Perform Task A');
    next(null, true);
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
    console.log(transactionResults);
  }, function(rollbackResults) {
    // Final rollback handler 
    console.error(rollbackResults);
  });
```
