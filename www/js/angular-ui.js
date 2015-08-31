var isMobile = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));


(function ($) {
}(jQuery));

define('angular-ui',
    ['jquery', 'jquery-ui', "angular", "angular-logger"],
    function ($, UI, angular) {
        var angularUIModule = angular.module("angUIApp", ['angular.logger']);

        angularUIModule.config(['$compileProvider', '$logProvider', 'LoggerProvider',
            function ($compileProvider, $logProvider, loggerProvider) {
                $compileProvider.debugInfoEnabled(false);
                $logProvider.debugEnabled(false);
                loggerProvider.enabled(false);
            }]);

        const TREE_SPLITTER = '.';
        angularUIModule.directive('treeDir', function () {
                return {
                    controller: function ($scope, $rootScope, $sce, findItem, isExpandedItem, selectFunction, Logger, buildEventName, switchClass, safeApply) {
                        var logger = Logger.getInstance('controller.tree');
                        this.items = [];
                        this.focusedElement = null;
                        this.itemClass = function (item) {
                            return item.selected ? "checked" : "checked-no";
                        };
                        this.itemCheckedClick = function ($event, item) {
                            var selected = (switchClass($event.target)) ? false : true;
                            if (!isNullAndUndef($scope.tree.fnSelect)) {
                                try {
                                    eval($scope.tree.fnSelect)(item, $scope.tree.items, selected);
                                    $($event.target).removeClass();
                                    $($event.target).addClass($scope.tree.itemClass(item));
                                    $rootScope.$broadcast(buildEventName("tree", $scope.tree.id, "selected"), {
                                        item: item,
                                        selected: item.selected
                                    });
                                } catch (e) {
                                    logger.error("is calling {0}", $scope.tree.fnSelect);
                                }
                                return;
                            }
                            item.selected = selected;
                            $rootScope.$broadcast(buildEventName("tree", $scope.tree.id, "selected"), {
                                item: item,
                                selected: selected
                            })
                        };
                        this.itemFilter = function (item) {
                            return isExpandedItem($scope.tree, item.name, true);
                        };
                        this.itemExpandedClick = function ($event, item) {
                            $scope.tree.setFocus($event, item);
                            if (item.leaf === true) {
                                return;
                            }
                            var sel = isExpandedItem($scope.tree, item.name, false);
                            if (sel) {
                                findItem($scope.tree, item.name).expanded = false;
                            } else {
                                findItem($scope.tree, item.name).expanded = true;
                            }
                        };
                        this.itemClick = function ($event, item) {
                            if (!isMobile) {
                                $scope.tree.setFocus($event, item);
                            } else {
                                $scope.tree.itemExpandedClick($event, item);
                            }
                        };
                        this.itemStyle = function (name) {
                            return "padding-left:" + ((name.split(TREE_SPLITTER).length - 1) * 20) + "px";
                        };
                        this.itemTextClass = function (item) {
                            var isLeaf = !isNullAndUndef(item.leaf) && item.leaf;
                            var focusedClassName = isLeaf ? "focusedLeaf" : "focused";
                            var nofocusedClassName = isLeaf ? "focusedLeaf-no" : "focused-no";
                            if (!isNullAndUndef($scope.tree.focusedElement)) {
                                var id = $($scope.tree.focusedElement).prop("identificator");
                                if (id === item.name) {
                                    return focusedClassName;
                                }
                            }
                            return nofocusedClassName;
                        };
                        this.setFocus = function ($event, item) {
                            var isLeaf = !isNullAndUndef(item.leaf) && item.leaf;
                            var focusedClassName = isLeaf ? "focusedLeaf" : "focused";
                            var nofocusedClassName = isLeaf ? "focusedLeaf-no" : "focused-no";
                            if (!isNullAndUndef(item.callback))
                                try {
                                    eval(item.callback)(item, $scope.tree.items);
                                } catch (e) {
                                    logger.error("is calling {0}", item.name);
                                }
                            if ($scope.tree.focusedElement === $event.target) {
                                return;
                            }
                            var className = $scope.tree.itemTextClass(item);
                            if (className === focusedClassName) {
                                $($scope.tree.focusedElement).prop("identificator", null);
                                $($scope.tree.focusedElement).removeClass();
                                $($scope.tree.focusedElement).addClass(nofocusedClassName);
                            }
                            $scope.tree.focusedElement = $event.target;
                            $($scope.tree.focusedElement).prop("identificator", item.name);
                            $($scope.tree.focusedElement).removeClass();
                            $($scope.tree.focusedElement).addClass(focusedClassName);
                            $rootScope.$broadcast(buildEventName("tree", $scope.tree.id, "focused"), {
                                item: item
                            });
                        };
                        $rootScope.$on(buildEventName("tree", $scope.tree.id, "init"), function (event, data) {
                            $scope.tree.items = data.items;
                            if (data.fnSelect == null) {
                                $scope.tree.fnSelect = null;
                            } else if (!isNullOrUndef(data.fnSelect)) {
                                $scope.tree.fnSelect = data.fnSelect;
                            }
                            safeApply($scope);
                        });
                        $rootScope.$on(buildEventName("tree", $scope.tree.id, "get_items"), function (event, data) {
                            data.callback($scope.tree.items);
                        });
                        $rootScope.$on(buildEventName("tree", $scope.tree.id, "get"), function (event, data) {
                            //isNullAndUndef($scope.tree.focusedElement)
                            var name = $($scope.tree.focusedElement).prop("identificator");
                            data.callback(findItem($scope.tree, name));
                        });
                        $scope.$watch("tree.items", function (newValue, oldValue) {
                        });
                    },
                    scope: {
                        id: '@',
                        fnSelect: '@'
                    },
                    restrict: 'E',
                    replace: true,
                    template: '<div><div style={{tree.itemStyle(item.name)}} ng-repeat="item in tree.items | filter:tree.itemFilter | orderBy:name track by $index">' +
                    '<img ng-class="tree.itemClass(item)" ng-click="tree.itemCheckedClick($event, item)"/><span ng-class="tree.itemTextClass(item)" ng-dblclick="tree.itemExpandedClick($event, item)" ng-click="tree.itemClick($event, item)">{{item.title}}</span>' +
                    '</div></div',
                    controllerAs: 'tree',
                    bindToController: true,
                    link: function (scope, element) {

                    }
                };
            }
        );

        angularUIModule.factory('findItem', ["$rootScope", function (rootScope) {
            return function (scope, name) {
                var ret = scope.items.filter(function (item) {
                    return item.name == name;
                });
                return ret.length > 0 ? ret[0] : null;
            };
        }]).factory('isExpandedItem', ["findItem", function (findItem) {
            return function (scope, name, isPrev) {
                var names = name.split(TREE_SPLITTER);
                if (names.length == 1 && isPrev) {
                    return true;
                }
                var n = "";
                names = names.slice(0, names.length - (isPrev ? 1 : 0));
                if (names.length == 0) {
                    return false;
                }
                var sel = names.every(function (ind) {
                    n += (n == "") ? ind : TREE_SPLITTER + ind;
                    var sec = findItem(scope, n);
                    return !isNullAndUndef(sec.expanded) && sec.expanded === true;
                });
                return sel;
            };
        }]).factory('getParents', ["$log", function ($log) {
            return function (name, items) {
                var names = name.split(TREE_SPLITTER);
                if (names.length == 1) {
                    return [];
                }
                var ns = [];
                var n = "";
                names = names.slice(0, names.length - 1);
                names.forEach(function (ind) {
                    n += (n == "") ? ind : TREE_SPLITTER + ind;
                    ns.push(n);
                });
                var parents = [];
                ns.filter(function (n) {
                    var parent = items.filter(function (it) {
                        return it.name === n;
                    });
                    if (parent.length > 0) {
                        parents.push(parent[0]);
                    }
                });
                $log.debug(parents);
                return parents;
            };
        }]).factory('getChilds', function () {
            return function (name, items) {
                return items.filter(function (it) {
                    return it.name !== name && it.name.indexOf(name) == 0;
                });
            }
        }).factory('selectFunction', function (Logger, getChilds, getParents) {
            return function (item, items, isSelected) {
                var logger = Logger.getInstance('selectFunction');
                var childs = getChilds(item.name, items);
                childs.forEach(function (child) {
                    child.selected = isSelected
                });
                item.selected = isSelected;
                if (isSelected) {
                    var parents = getParents(item.name, items);
                    parents.forEach(function (parent) {
                        parent.selected = isSelected;
                    });
                }
                logger.debug('selected={0}', [angular.toJson(item)]);
            }
        }).factory('focusFunction', function (Logger) {
            return function (name, items) {
                return items.filter(function (it) {
                    var isFocused = it.name !== name && it.name.indexOf(name) == 0;
                    var logger = Logger.getInstance('focusFunction');
                    logger.debug("focused: {0}, {1}", [isFocused, angular.toJson(it)]);
                    return isFocused;
                });
            }
        }).factory('buildEventName', function () {
            return function (controllerName, elementId, eventType) {
                return 'appUIApp.' + controllerName + '.' + elementId + '.' + eventType;
            }
        }).factory('switchClass', function () {
            return function (el) {
                var className = $(el).attr("class");
                var classNames = ("" + className).split(" ");
                var first = true;
                var isn = false;
                classNames.forEach(function (n) {
                    if (first) {
                        var ns = ("" + n).split("-");
                        className = ns.length > 1 ? ns[0] : ns[0] + "-no";
                        isn = ns.length == 1;
                        first = false;
                    } else {
                        className += " " + n;
                    }
                });
                $(el).removeClass();
                $(el).addClass(className);
                return isn;
            }
        }).factory('safeApply', function () {
            return function (scope) {
                var phase = scope.$root.$$phase;
                if (phase == '$apply' || phase == '$digest') {
                    scope.$eval();
                } else {
                    scope.$apply();
                }
            }
        });

        function TreeItems() {
            this.items = [];
            this.sortItems = [];
            var isSorted = false;
            this.add = function (treeItem) {
                this.items.push(treeItem);
                this.sortItems.push(treeItem);
                isSorted = false;
            };
            this.add = function (name, selected, leaf, title, dict) {
                var treeItem = new TreeItem(name, selected, leaf, title, dict);
                this.items.push(treeItem);
                this.sortItems.push(treeItem);
                isSorted = false;
                return treeItem;
            };
            this.getItems = function () {
                return this.items;
            };
            this.getSortItems = function () {
                if (!isSorted) {
                    this.sortItems.sort(function (a, b) {
                        return a.name.localeCompare(b.name);
                    });
                    isSorted = true;
                }
                return this.sortItems;
            };
        }

        function TreeItem(name, selected, leaf, title) {
            this.name = name;
            this.selected = selected;
            this.title = title;
            this.expanded = false;
            this.leaf = leaf;
            this.prop = new Hashtable();
        }

        angularUIModule.directive("selectDir", function ($rootScope, $timeout, buildEventName, safeApply) {
            return {
                controller: function ($scope, buildEventName) {
                    this.selected = void (0);
                    this.options = [{value: void (0), label: '-'}];
                    this.ngSelected = function (val) {
                        return val == this.selected ? true : false;
                    }
                    $scope.$on(buildEventName('select', $scope.sel.id, 'init'), function (event, data) {
                        $scope.sel.options = data.items;
                        if (!isNullAndUndef(data.selected)) {
                            $scope.sel.selected = data.selected;
                        }
                        safeApply($scope);
                        if (!isNullAndUndef($scope.element)) {
                            $timeout(fn = function () {
                                if (!isNullAndUndef($rootScope.$$phase)) {
                                    $timeout(fn);
                                    return;
                                }
                                ;
                                $($scope.element.get(0)).selectmenu("refresh");
                            });
                        }
                    });
                    $scope.$on(buildEventName('select', $scope.sel.id, 'get'), function (event, fn) {
                        fn({selected: $scope.sel.selected});
                    });
                },
                scope: {id: '@'},
                restrict: 'E',
                replace: true,
                template: "<select>" +
                "<option ng-repeat='opt in sel.options' ng-selected='sel.ngSelected(opt.value)' value='{{opt.value}}'>{{opt.label}}</option>" +
                "</select>",
                controllerAs: "sel",
                bindToController: true,
                link: {
                    post: function postLink(scope, element) {
                        var fn;
                        $timeout(fn = function () {
                            if (!isNullAndUndef($rootScope.$$phase)) {
                                $timeout(fn);
                                return;
                            }
                            ;
                            scope.element = element;
                            $(element.get(0)).selectmenu({
                                width: 100,
                                change: function (event, el) {
                                    scope.sel.selected = el.item.value;
                                    scope.$apply();
                                    $rootScope.$broadcast(buildEventName('select', scope.sel.id, 'selected'), {selected: scope.sel.selected});
                                }
                            });
                            $(element.get(0)).selectmenu("refresh");
                        });
                    }
                }
            }
        });

        angularUIModule.directive("checkDir", function (buildEventName, $timeout, $rootScope) {
            return {
                controller: function ($scope, Logger) {
                    this.item = {title: ['yes', 'no'], css: ['', ''], selected: false};
                    this.ngChecked = function () {
                        return $scope.check.item.selected;
                    };
                    this.getTitle = function () {
                        var tt = $scope.check.item.selected ? $scope.check.item.title[0] : $scope.check.item.title[1];
                        Logger.getInstance('check.getTitle').debug('sel: {0}, title: {1}', [$scope.check.item.selected, tt]);
                        return tt;
                    };
                    this.ngClass = function () {
                        if (isNullAndUndef($scope.check.item.css) || $scope.check.item.css.length == 0) {
                            return '';
                        }
                        var css = $scope.check.item.selected ? $scope.check.item.css[0] : $scope.check.item.css[1];
                        Logger.getInstance('check.css').debug('sel: {0}, css: {1}', [$scope.check.item.selected, css]);
                        return css;
                    };
                    $scope.$on(buildEventName('check', $scope.check.id, 'init'), function (event, data) {
                        $scope.check.item = data.item;
                        $scope.$apply();
                        if (!isNullAndUndef($scope.element)) {
                            $('[for=' + $scope.check.id + '] span').text($scope.check.getTitle());
                            $($scope.element.children()[0]).button("refresh");
                        }
                    });
                    $scope.$on(buildEventName('check', $scope.check.id, 'get'), function (event, fn) {
                        fn({
                            selected: $scope.check.item.selected,
                            title: '' + $scope.check.item.title
                        });
                    });
                },
                scope: {id: '@'},
                restrict: 'E',
                replace: true,
                template: "<div style='display: inline'><input id='{{check.id}}' type='checkbox' ng-checked='check.ngChecked()'><label ng-class='check.ngClass()' for='{{check.id}}'>{{check.getTitle()}}</label></div>",
                controllerAs: "check",
                bindToController: true,
                link: {
                    post: function postLink(scope, element) {
                        var fn;
                        $timeout(fn = function () {
                            if (!isNullAndUndef($rootScope.$$phase)) {
                                $timeout(fn);
                                return;
                            }
                            ;
                            element.removeAttr("id");
                            scope.element = element;
                            $(element.children()[0]).bind("change", function () {
                                scope.check.item.selected = this.checked;
                                scope.$apply();
                                $('[for=' + scope.check.id + '] span').text(scope.check.getTitle());
                                $rootScope.$broadcast(buildEventName('check', scope.check.id, 'selected'), {
                                    title: scope.check.getTitle(),
                                    selected: scope.check.item.selected
                                });
                            });
                            $(element.children()[0]).button({});
                        });
                    }
                }
            }
        });

        angularUIModule.directive("radioDir", ["$compile", "$timeout", "$rootScope",
            'buildEventName', function ($compile, $timeout, $rootScope, buildEventName) {
                return {
                    controller: function ($scope, $rootScope, $sce, findItem, isExpandedItem, Logger) {
                        this.items = [{name: '-', title: '-', css: ''}];
                        this.selected = '-';
                        this.formatId = function (index) {
                            return isNullAndUndef(index) ? '' + $scope.radio.id.trim() : '' + $scope.radio.id.trim() + index;
                        };
                        this.ngClick = function (item) {
                            Logger.getInstance('radioDir.ngClick').debug('item : {0}', [item.name]);
                            $scope.radio.selected = item.name;
                            $rootScope.$broadcast(buildEventName('radio', $scope.radio.id, 'selected'), {selected: item.name});
                        };
                        this.ngChecked = function (item) {
                            return item.name === $scope.radio.selected;
                        };
                        $scope.$on(buildEventName('radio', $scope.radio.id, 'init'), function (event, data) {
                            $scope.radio.items = [];
                            $scope.radio.selected = data.selected;
                            $scope.$apply();
                            $scope.radio.items = data.items;
                            $scope.radio.selected = data.selected;
                            $scope.$apply();
                            if (!isNullAndUndef($scope.element)) {
                                $($scope.element[0]).buttonset("refresh");
                            }
                        });
                        $scope.$on(buildEventName('radio', $scope.radio.id, 'set'), function (event, data) {
                            $scope.radio.selected = data.selected;
                            var phase = $scope.$root.$$phase;
                            if (phase == '$apply' || phase == '$digest') {
                                $scope.$eval();
                            } else {
                                $scope.$apply();
                            }
                                if (!isNullAndUndef($scope.element)) {
                                    $timeout(fn = function () {
                                        if (!isNullAndUndef($rootScope.$$phase)) {
                                            $timeout(fn);
                                            return;
                                        }
                                        ;
                                        $($scope.element[0]).buttonset("refresh");
                                    });
                                }
                        });
                        $scope.$on(buildEventName('radio', $scope.radio.id, 'get'), function (event, fn) {
                            fn({selected: '' + $scope.radio.selected});
                        });
                    },
                    scope: {id: '@'},
                    restrict: 'E',
                    replace: true,
                    template: "<div ></div>",
                    controllerAs: "radio",
                    bindToController: true,
                    template: "<div style='display: inline'><input id='{{radio.formatId($index)}}' name='{{radio.id}}' type='radio' ng-click='radio.ngClick(item)' ng-checked='radio.ngChecked(item)' ng-repeat-start='item in radio.items track by $index'/><label for='{{radio.formatId($index)}}' ng-class='item.css' ng-repeat-end>{{item.title}}</label></div>",
                    link: {
                        pre: function preLink(scope, iElement, iAttrs, controller) {
                        },
                        post: function postLink(scope, element, iAttrs, controller) {
                            var fn;
                            $timeout(fn = function () {
                                if (!isNullAndUndef($rootScope.$$phase)) {
                                    $timeout(fn);
                                    return;
                                }
                                ;
                                scope.element = element;
                                element.children().each(function (idx, val) {
                                    $(val).removeAttr("ng-repeat-start");
                                    $(val).removeAttr("ng-repeat-end");
                                });
                                $(element[0]).buttonset();
                            });
                        }
                    }

                }
            }]);

        angularUIModule.directive("buttonDir", function (buildEventName, $timeout, $rootScope) {
            return {
                controller: function ($scope, $element) {
                    this.item = {
                        title: '-',
                        disabled: false,
                        callback: function (id) {
                        }
                    };
                    this.ngClick = function () {
                        $scope.but.item.callback($scope.but.id);
                    };
                    this.ngDisabled = function() {
                        var disabled = $scope.but.item.disabled;
                        return isNullOrUndef(disabled) ? false : disabled;
                    };
                    $scope.$on(buildEventName('button', $scope.but.id, 'init'), function (event, data) {
                        $scope.but.item = data.item;
                        $($element.children()[0]).button('option', 'disabled', $scope.but.ngDisabled());
                        $scope.$apply()
                    });
                },
                scope: {id: '@'},
                restrict: 'E',
                replace: true,
                template: "<div><input id='{{but.id}}' type='submit' ng-click='but.ngClick()' ng-value='but.item.title' ng-disabled='but.ngDisabled()' /></div>",
                controllerAs: "but",
                bindToController: true,
                link: {
                    post: function postLink(scope, element) {
                        var fn;
                        $timeout(fn = function () {
                            if (!isNullAndUndef($rootScope.$$phase)) {
                                $timeout(fn);
                                return;
                            }
                            ;
                            $(element.children()[0]).button({});
                        });
                    }
                }
            }
        });

        angularUIModule.directive("textDir", function (buildEventName, $timeout, $rootScope) {
            return {
                controller: function ($scope, $rootScope, $sce, findItem, isExpandedItem, $log) {
                    this.item = {
                        title: 'text', disabled: false, text: '', callback: function (id, text) {
                        }
                    };
                    this.ngDisabled = function() {
                        var disabled = $scope.text.item.disabled;
                        return isNullOrUndef(disabled) ? false : disabled;
                    };
                    $scope.$on(buildEventName('text', $scope.text.id, 'init'), function (event, data) {
                        $scope.text.item = data.item;
                        $scope.$apply()
                    });
                    $scope.$on(buildEventName('text', $scope.text.id, 'get'), function (event, fn) {
                        fn({
                            text: '' + $scope.text.item.text
                        });
                    });
                    $scope.$watch('text.item.text', function (newValue, oldValue) {
                        if (!isNullOrUndef($scope.text.item.callback)) {
                            $scope.text.item.callback($scope.text.id, newValue);
                        }
                    });
                },
                scope: {
                    id: '@',
                    classname: '@class'
                },
                restrict: 'E',
                replace: true,
                template: "<div><input id='{{text.id}}' type='text' ng-disabled='text.ngDisabled()' ng-class='text.classname' ng-model='text.item.text'><label for='{{text.id}}'>{{text.item.title}}</label></div>",
                controllerAs: "text",
                bindToController: true,
                link: {
                    post: function postLink(scope, element) {
                    }
                }
            }
        });

        angularUIModule.directive("enumDir", ["$compile", "$timeout", "$rootScope",
            'buildEventName', "safeApply", function ($compile, $timeout, $rootScope, buildEventName, safeApply) {
                return {
                    controller: function ($scope, $rootScope) {
                        if (isNullOrUndef(this.init)) {
                            this.items = [
                                {title: '', css: ''}
                            ];
                        } else {
                            this.items = angular.fromJson(this.init);
                        }
                        this.selected = 0;
                        this.ngClick = function (item) {
                            $scope.enum.selected = $scope.enum.selected == $scope.enum.items.length - 1 ? 0 : $scope.enum.selected + 1;
                            $rootScope.$broadcast(buildEventName('enum', $scope.enum.id, 'selected'), {selected: $scope.enum.selected});
                            if (!isNullOrUndef($scope.enum.callback)) {
                                eval($scope.enum.callback)($scope.enum.id, $scope.enum.selected, $scope.enum.name);
                            }
                        };
                        this.ngClass = function (item) {
                            return item.css;
                        };
                        this.ngShow = function (item) {
                            return $scope.enum.items.indexOf(item) == $scope.enum.selected;
                        };
                        $scope.$on(buildEventName('enum', $scope.enum.id, 'init'), function (event, data) {
                            $scope.enum.items = data.items;
                            $scope.enum.selected = data.selected;
                            safeApply($scope);
                        });
                        $scope.$on(buildEventName('enum', $scope.enum.id, 'set'), function (event, data) {
                            $scope.enum.selected = data.selected;
                            safeApply($scope);
                        });
                        $scope.$on(buildEventName('enum', $scope.enum.id, 'get'), function (event, fn) {
                            fn({selected: '' + $scope.enum.selected});
                        });
                    },
                    scope: {id: '@', init: '@', name: '@', callback: '@'},
                    restrict: 'E',
                    replace: true,
                    controllerAs: "enum",
                    bindToController: true,
                    template: "<div><div ng-class='enum.ngClass(item)' ng-click='enum.ngClick(item)' ng-show='enum.ngShow(item)' ng-repeat='item in enum.items track by $index'>{{item.title}}</sp></div>",
                    link: {
                        pre: function preLink(scope, iElement, iAttrs, controller) {
                        },
                        post: function postLink(scope, element, iAttrs, controller) {
                            var fn;
                            $timeout(fn = function () {
                                scope.element = element;
                                if (!isNullAndUndef($rootScope.$$phase)) {
                                    $timeout(fn);
                                    return;
                                }
                                ;
                                element.children().each(function (idx, val) {
                                    $(val).removeAttr("ng-repeat");
                                });
                                $(element[0]).buttonset();
                            });
                        }
                    }

                }
            }]);

        function isNullAndUndef(arg) {
            return (arg === null || arg === void (0));
        }

        function isNullOrUndef(arg) {
            return (arg === null || arg === void (0));
        }

        return {
            TreeItems: TreeItems,
            TreeItem: TreeItem
        }
    });