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
        }
        ;
    };

    Utils.toString = function (arg, def) {
        return Utils.isNullOrUndef(arg) ? def : '' + arg;
    };



    var queueBlockUI = [];

    setInterval(function() {
        if (queueBlockUI.length > 0) {
            var fn = queueBlockUI.shift();
            fn();
        }
    }, 1000);

    Utils.blockUI = function () {
        queueBlockUI.push(function () {
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
        });
    };

    Utils.unblockUI = function () {
        queueBlockUI.push(function () {
            $.unblockUI();
        });
    };

    Utils.isBlank = function (s) {
        return Utils.isNullOrUndef(s) || s.replace(new RegExp('[ ]+', 'g'), '').length == 0;
    };

    Utils.escapeSymbols = [
        ['[_]', ' '],
        ['@0095', '_'],
        ['@0046', '.'],
        ['@0039', '\''],
        ['@0044', ','],
        ['@0045', '-'],
        ['@0063', '?']
    ];

    Utils.escapeSymbol = function (text) {
        var t = text;
        $.each(Utils.escapeSymbols, function (ind, val) {
            t = t.replace(new RegExp(val[0], 'g'), val[1]);
        });
        return t;
    }

    Utils.setEscapeSymbols = function (escapes) {
        if (Utils.isNullOrUndef(escapes)) {
            return;
        }
        var hset = new HashSet();
        $.each(Utils.escapeSymbols, function (ind, val) {
            hset.add(val[0]);
        });
        $.each(escapes, function (ind, val) {
            if (!hset.contains(val[0])) {
                Utils.escapeSymbols.push(val);
            }
        });
    };

    Utils.removeFileExt = function (path) {
        return path.substr(0, path.length - 4);
    };

    return Utils;
});
