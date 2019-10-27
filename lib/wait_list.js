/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var assert = Iron.utils.assert;

/*****************************************************************************/
/* Private */
/*****************************************************************************/

/**
 * Returns an object of computation ids starting with
 * the current computation and including all ancestor
 * computations. The data structure is an object
 * so we can index by id and do quick checks.
 */
var parentComputations = function () {
  var list = {};
  var c = Tracker.currentComputation;

  while (c) {
    list[String(c._id)] = true;
    c = c._parent;
  }

  return list;
};

/**
 * Check whether the user has called ready() and then called wait(). This
 * can cause a condition that can be simplified to this:
 *
 * dep = new Tracker.Dependency;
 *
 * Tracker.autorun(function () {
 *   dep.depend();
 *   dep.changed();
 * });
 */
var assertNoInvalidationLoop = function (dependency) {
  var parentComps = parentComputations();
  var depCompIds = _.keys(dependency._dependentsById);

  _.each(depCompIds, function (id) {
    assert(!parentComps[id], "\n\n\
You called wait() after calling ready() inside the same computation tree.\
\n\n\
You can fix this problem in two possible ways:\n\n\
1) Put all of your wait() calls before any ready() calls.\n\
2) Put your ready() call in its own computation with Tracker.autorun."
    );
  });
};


/*****************************************************************************/
/* WaitList */
/*****************************************************************************/
/**
 * A WaitList tracks a list of reactive functions, each in its own computation.
 * The list is ready() when all of the functions return true. This list is not
 * ready (i.e. this.ready() === false) if at least one function returns false.
 *
 * You add functions by calling the wait(fn) method. Each function is run its
 * own computation. The ready() method is a reactive method but only calls the
 * deps changed function if the overall state of the list changes from true to
 * false or from false to true.
 */
WaitList = function () {
  this._readyDep = new Tracker.Dependency;
  this._comps = [];
  this._notReadyCount = 0;
};

/**
 * Pass a function that returns true or false.
 */
WaitList.prototype.wait = function (fn) {
  var self = this;

  var activeComp = Tracker.currentComputation;

  assertNoInvalidationLoop(self._readyDep);

  // break with parent computation and grab the new comp
  Tracker.nonreactive(function () {

    // store the cached result so we can see if it's different from one run to
    // the next.
    var cachedResult = null;

    // create a computation for this handle
    var comp = Tracker.autorun(function (c) {
      // let's get the new result coerced into a true or false value.
      var result = !!fn();

      var oldNotReadyCount = self._notReadyCount;

      // if it's the first run and we're false then inc
      if (c.firstRun && !result)
        self._notReadyCount++;
      else if (cachedResult !== null && result !== cachedResult && result === true)
        self._notReadyCount--;
      else if (cachedResult !== null && result !== cachedResult && result === false)
        self._notReadyCount++;

      cachedResult = result;

      if (oldNotReadyCount === 0 && self._notReadyCount > 0)
        self._readyDep.changed();
      else if (oldNotReadyCount > 0 && self._notReadyCount === 0)
        self._readyDep.changed();
    });

    self._comps.push(comp);

    if (activeComp) {
      activeComp.onInvalidate(function () {
        // keep the old computation and notReadyCount the same for one
        // flush cycle so that we don't end up in an intermediate state
        // where list.ready() is not correct.

        // keep the state the same until the flush cycle is complete
        Tracker.afterFlush(function () {
          // stop the computation
          comp.stop();

          // remove the computation from the list
          self._comps.splice(_.indexOf(self._comps, comp), 1);

          if (cachedResult === false) {
            self._notReadyCount--;

            if (self._notReadyCount === 0)
              self._readyDep.changed();
          }
        });
      });
    }
  });
};

WaitList.prototype.ready = function () {
  this._readyDep.depend();
  return this._notReadyCount === 0;
};

WaitList.prototype.stop = function () {
  _.each(this._comps, function (c) { c.stop(); });
  this._comps = [];
};

Iron.WaitList = WaitList;
