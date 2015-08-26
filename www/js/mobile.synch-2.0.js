define('mobile-synch', ['jquery'], function ($) {
    function CallStack(thisArg) {
        var $thisArg = thisArg;
        var $processed = [];
        var $processing = [];
        var $results = {};
        var self = this;
        var $cloneContext;
        this.context = {
            predicate: {},
            fn: {},
            queue: []
        };

        this.isBusy = function () {
            return self.context.queue.length > 0;
        };

        this.reset = function () {
            $processed = [];
            $processing = [];
            $results = {};
            this.fn = {};
            this.context = {
                predicate: {},
                fn: {},
                queue: []
            };
        };

        this.next = function () {
            if (self.context.queue.length > 0) {
                var name = self.context.queue[0];
                var predicate = self.context.predicate[name];
                if (CallStack.isNullOrUndef(predicate) || predicate.length > 0) {
                    var args = [];
                    args['results'] = $results;
                    self.context.fn[name](args);
                }
            }
            return self;
        };

        this.addFn = function (name, fn, predicate) {
            self.context.predicate[name] = predicate;
            self.context.queue.push(name);
            self.context.fn[name] = function () {
                var predicate = self.context.predicate[name];
                if (CallStack.isNullOrUndef(predicate)) {
                    if (self.context.queue[0] != name) {
                        return self;
                    }
                } else {
                    if (predicate.length > 0 && predicate.filter(function (name) {
                            return $processed.indexOf(name) != -1;
                        }).length != predicate.length) {
                        return self;
                    }
                }
                if ($processing.indexOf(name) != -1 || $processed.indexOf(name) != -1) {
                    return self;
                }
                $processing.push(name);
                self.context.queue.splice(self.context.queue.indexOf(name), 1);
                var args = Array.prototype.slice.call(arguments);
                args['results'] = $results;
                var result = fn.call($thisArg, args);
                if (!CallStack.isNullOrUndef(result)) {
                    for (var key in result) {
                        $results[key] = result[key];
                    }
                }
                $processed.push(name);
                return self.next();
            };
            $cloneContext = $.extend(true, {}, this.context);
        }
    };

    CallStack.isNullOrUndef = function (arg) {
        return (arg === null || arg === void (0));
    };

    return CallStack;
});

/**
 function Test1() {
    this.readConfig = function (obj) {
        console.log('readConfig: ' + obj[0] + ', ' + obj.results);
        return {readConfig: 100};
    };
    this.writeConfig = function (obj) {
        console.log('writeConfig: ' + obj[0] + ', ' + obj[1] + ', ' + obj.results);
        return {writeConfig: 'writeConfig'};
    };
    this.execute = function (obj) {
        console.log('execute: ' + obj[0] + ', ' + obj[1] + ', ' + obj.results);
    };
    this.execute2 = function (obj) {
        console.log('execute2: ' + obj[0] + ', ' + obj[1] + ', ' + obj.results);
    };
}
 var test1 = new Test1();
 var st = new CallStack(test1);
 st.addFn('readConfig', test1.readConfig, []);
 st.addFn('execute', test1.execute, ['writeConfig']);
 st.addFn('writeConfig', test1.writeConfig, []);
 st.addFn('execute2', test1.execute2);
 st.context.fn.readConfig('readConfig').context.fn.execute('execute').context.fn.writeConfig('writeConfig').context.fn.writeConfig('execute2');
 console.log('**********************************************************************************************')
 st = new CallStack(test1);
 st.addFn('execute', test1.execute, []);
 st.addFn('readConfig', test1.readConfig, []);
 st.addFn('writeConfig', test1.writeConfig, []);
 st.addFn('execute2', test1.execute2);
 st.context.fn.readConfig('readConfig').context.fn.execute('execute').context.fn.writeConfig('writeConfig');
 */