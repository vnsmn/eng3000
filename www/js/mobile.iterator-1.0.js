define('mobile-iterator', ['jquery', 'angular', 'angular-logger'], function ($, angular) {
    var injector = angular.injector(['ng', 'angular.logger']);
    var logger = injector.get('Logger').getInstance("iterator");

    function Iterator(array) {
        var index = -1;
        var interrupt = false;
        var self = this;

        this.array = array;
        this.hasNext = function () {
            if (interrupt) {
                //logger.debug('hasnext return false as is interruped.')
                return false;
            } else {
                return index <= self.array.length - 2;
            }
        };
        this.next = function () {
            if (interrupt) {
                //logger.debug('next return false as is interruped.')
                return null;
            } else {
                return self.array.length == 0 || !self.hasNext() ? null : self.array[++index];
            }
        };
        this.reset = function () {
            if (!interrupt) {
                index = -1;
            }
        };
        this.setInterrupt = function() {
            //logger.debug('set interrupt.')
            interrupt = true;
        }
        this.resetInterrupt = function() {
            //logger.debug('set interrupt.')
            interrupt = false;
        }
    }

    return Iterator;
});
