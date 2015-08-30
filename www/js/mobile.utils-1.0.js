define('mobile-utils', ['jquery', 'block-ui'], function ($) {

    function Utils() {
    }

    Utils.queue = new Hashtable();

    Utils.isNullOrUndef = function (arg) {
        return arg === null || arg === void (0);
    };

    Utils.invokeLate = function (label, stateFn, fn, delay) {
        var wrapper;
        var prevState = stateFn();
        if (!Utils.isBlank(label)) {
            if (Utils.queue.containsKey(label)) {
                return;
            }
            Utils.queue.put(label, fn);
            setTimeout(wrapper = function () {
                var state = stateFn();
                if (prevState == state) {
                    Utils.queue.remove(label);
                    fn();
                } else {
                    prevState = state;
                    setTimeout(wrapper, delay);
                }
            }, delay);
        };
    };

    Utils.toString = function (arg, def) {
        return Utils.isNullOrUndef(arg) ? def : '' + arg;
    };

    Utils.blockUI = function () {
        setTimeout(function () {
            $.blockUI({
                message: '<span style="font-size: small">Please wait...</span>',
                css: {
                    border: 'none',
                    padding: '15px',
                    backgroundColor: '#000',
                    '-webkit-border-radius': '10px',
                    '-moz-border-radius': '10px',
                    opacity: .5,
                    color: '#fff',
                    'font-size': 'smaller',
                    cursor: 'wait'
                }
            });
        }, 0);
    };

    Utils.unblockUI = function () {
        setTimeout($.unblockUI, 500);
    };

    Utils.isBlank = function (s) {
        return Utils.isNullOrUndef(s) || s.replace(new RegExp('[ ]+', 'g'), '').length == 0;
    };

    return Utils;
});
