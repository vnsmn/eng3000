define('mobile.ui',
    ['jquery', 'jquery-ui', 'mobile-synch', 'mobile-sound', "angular", "angular-ui", "mobile-file"],
    function ($, UI, CallStack, sound, angular, angularUI, FileManager) {
        var appModule = angular.module("app", ['angUIApp']);
        var configuration = new Configuration();
        var soundManager = new sound.SoundManager();

        function Setup(injector) {
            var url = "dictionary.json";
            var dic;
            var $injector = injector;
            var self = this;
            var $callStack = new CallStack(this);
            var currentPlayID;
            var mapSources = new Hashtable();
            var sources;
            var sortName = 'sortn';

            var filterToInt = function () {
                var cnf = configuration.getData();
                var i = cnf.pronID.sel == 'br' ? 1 : 2;
                i = i + (cnf.playRusID.sel ? 4 : 0);
                return i;
            }

            var reloadSetup = function () {
                $callStack.reset();
                $callStack.addFn('loadDictionary', self.loadDictionary);
                $callStack.addFn('updateDictionary', self.updateDictionary, []);
                $callStack.addFn('initSetupWidgets', self.initSetupWidgets);
                $callStack.next();
            };

            var reloadDictionaryWidget = function () {
                self.stopSound();
                setTimeout(function () {
                    $callStack.reset();
                    $callStack.addFn('initDictionaryWidgets', self.initDictionaryWidgets);
                    $callStack.next();
                }, 100);
            };

            injector.invoke(function ($rootScope) {
                $rootScope.$broadcast("appUIApp.enum.playID.init", {
                    items: [
                        {title: '', css: 'media-play-start'},
                        {title: '', css: 'media-play-stop'}
                    ],
                    selected: 0
                });
                $rootScope.$on("appUIApp.enum.playID.selected", function (event, data) {
                    if (data.selected == 1) {
                        if (currentPlayID != "playID") {
                            self.stopSound.apply(self);
                        }
                        currentPlayID = "playID";
                        soundManager.setSources(sources);
                        soundManager.play();
                    } else {
                        currentPlayID = null;
                        soundManager.stop();
                    }
                });
                $rootScope.$broadcast("appUIApp.radio.sort1ID.init", {
                    items: [
                        {name: 'sortn', title: '', css: 'sort-no'},
                        {name: 'sort123', title: '', css: 'sort-123'},
                        {name: 'sort321', title: '', css: 'sort-321'},
                        {name: 'sort132', title: '', css: 'sort-132'}
                    ],
                    selected: 'sortn'
                });
                $rootScope.$on("appUIApp.radio.sort1ID.selected", function (event, data) {
                    var sorts = new Hashtable();
                    sorts.put('sortn', 0);
                    sorts.put('sort123', 1);
                    sorts.put('sort321', 2);
                    sorts.put('sort132', 3);
                    sortName = data.selected;
                    reloadDictionaryWidget();
                    $rootScope.$broadcast("appUIApp.enum.sort2ID.set", {
                        selected: sorts.get(data.selected)
                    });
                });
                $rootScope.$broadcast("appUIApp.enum.sort2ID.init", {
                    items: [
                        {title: '', css: 'sort-no'},
                        {title: '', css: 'sort-123'},
                        {title: '', css: 'sort-321'},
                        {title: '', css: 'sort-132'}
                    ],
                    selected: 0
                });
                $rootScope.$on("appUIApp.enum.sort2ID.selected", function (event, data) {
                    var sorts = ['sortn', 'sort123', 'sort321', 'sort132']
                    sortName = sorts[data.selected];
                    reloadDictionaryWidget();
                    $rootScope.$broadcast("appUIApp.radio.sort1ID.set", {
                        selected: sortName
                    });
                });
                $rootScope.$on("appUIApp.enum.playID.selected", function (event, data) {

                });
                $rootScope.$broadcast("appUIApp.button.playID.init", {
                    item: {
                        title: 'play',
                        callback: function (id) {
                            $('#buttonID2').text('buttonID buttonID: ' + id);
                        }
                    }
                });
                $rootScope.$on("appUIApp.tree.wordID.selected", function (event, data) {
                    if (data.selected) {
                        configuration.getData().wordID.push(data.item.name);
                    } else {
                        var i = configuration.getData().wordID.indexOf(data.item.name);
                        if (i != -1) {
                            configuration.getData().wordID.splice(i, 1);
                        }
                    }
                });
                $rootScope.$on("appUIApp.select.conflistID.selected", function (event, data) {
                    configuration.select(data.selected);
                    reloadSetup();
                });
                $rootScope.$on("appUIApp.enum.pronDicID.selected", function (event, data) {
                    configuration.getData().pronID.sel = ['am', 'br'][data.selected];
                    self.stopSound();
                    soundManager.setFilter(filterToInt());
                });
                $rootScope.$on("appUIApp.check.showRusDicID.selected", function (event, data) {
                    configuration.getData().showRusID.sel = data.selected;
                    reloadDictionaryWidget();
                });
                $rootScope.$on("appUIApp.check.playRusDicID.selected", function (event, data) {
                    configuration.getData().playRusID.sel = data.selected;
                    self.stopSound();
                    soundManager.setFilter(filterToInt());
                });
            });

            var buildDictionaryTree = function (jsonText) {
                var dic = new angularUI.TreeItems();
                $.each(angular.fromJson(jsonText), function (ind, val) {
                    var isLeaf = !Setup.isNullOrUndef(val.dict) && val.dict.length > 0;
                    dic.add(ind, false, false, val.title, val.dict);
                    if (isLeaf) {
                        $.each(val.dict, function (ind2, ws) {
                            var eng = ws[0];
                            var rus = ws[1];
                            var tr = ws[2];
                            var name = ind + "." + eng;
                            var treeItem = dic.add(name, false, true, eng);
                            treeItem.prop.put('eng', eng);
                            treeItem.prop.put('trans', Setup.toString(tr, ''));
                            treeItem.prop.put('rus', Setup.toString(rus, ''));
                        });
                    }
                });
                return dic;
            };

            this.loadDictionary = function () {
                var src = new FileManager().resolveFilePath(url, configuration.getData().dicDirID.sel);
                //console.log('Loading dictionary by path: ' + src);
                new FileManager().readTextFile(src, function (jsonText) {
                    self.dic = buildDictionaryTree(jsonText);
                    //console.log('Loaded dictionary by path: ' + src);
                    $callStack.context.fn.updateDictionary(self.dic);
                }, function (error) {
                    self.dic = new angularUI.TreeItems();
                    openDialog('File manager', error);
                });
            };

            this.updateDictionary = function () {
                if (!Setup.isNullOrUndef(self.dic)) {
                    $.each(self.dic.getItems(), function (ind, item) {
                        item.selected = configuration.getData().wordID.indexOf(item.name) != -1;
                    });
                }
            };

            this.updateConfiguration = function () {
                $injector.invoke(function ($rootScope) {
                    $rootScope.$broadcast("appUIApp.check.showRusID.get", function (data) {
                        configuration.getData().showRusID.sel = data.selected;
                    });
                    $rootScope.$broadcast("appUIApp.check.playRusID.get", function (data) {
                        configuration.getData().playRusID.sel = data.selected;
                    });
                    $rootScope.$broadcast("appUIApp.radio.pronID.get", function (data) {
                        configuration.getData().pronID.sel = data.selected;
                    });
                    $rootScope.$broadcast("appUIApp.select.delayEngEngID.get", function (data) {
                        configuration.getData().delayEngEngID.sel = data.selected;
                    });
                    $rootScope.$broadcast("appUIApp.select.delayEngRusID.get", function (data) {
                        configuration.getData().delayEngRusID.sel = data.selected;
                    });
                    $rootScope.$broadcast("appUIApp.tree.wordID.get_items", {
                        callback: function (items) {
                            configuration.getData().wordID = [];
                            $.each(items, function (ind, item) {
                                if (item.selected) {
                                    configuration.getData().wordID.push(item.name);
                                } else {
                                    var i = configuration.getData().wordID.indexOf(item.name);
                                    if (i != -1) {
                                        configuration.getData().wordID.splice(i, i + 1);
                                    }
                                }
                            });
                        }
                    });
                    $rootScope.$broadcast("appUIApp.text.dicDirID.get", function (data) {
                        configuration.getData().dicDirID.sel = data.text;
                    });
                });
                configuration.save();
            };

            this.initSetupWidgets = function () {
                injector.invoke(function ($rootScope) {
                    $rootScope.$broadcast("appUIApp.text.dicDirID.init", {
                        item: {
                            title: '', text: configuration.getData().dicDirID.sel, callback: null
                        }
                    });
                    $rootScope.$broadcast("appUIApp.tree.wordID.init", {
                        items: self.dic.getSortItems()
                    });
                    $rootScope.$broadcast("appUIApp.radio.pronID.init", {
                        items: [{name: 'am', title: 'am', css: 'flag-icon-us'}, {
                            name: 'br',
                            title: 'br',
                            css: 'flag-icon-br'
                        }],
                        selected: configuration.getData().pronID.sel
                    });
                    $rootScope.$broadcast("appUIApp.check.showRusID.init", {
                        item: {title: ['yes', 'no'], selected: configuration.getData().showRusID.sel}
                    });
                    $rootScope.$broadcast("appUIApp.check.playRusID.init", {
                        item: {title: ['yes', 'no'], selected: configuration.getData().playRusID.sel}
                    });
                    $rootScope.$broadcast("appUIApp.select.delayEngEngID.init", {
                        items: [{value: 0, label: 'Delay 0s'},
                            {value: 1, label: 'Delay 1s'},
                            {value: 2, label: 'Delay 2s'},
                            {value: 3, label: 'Delay 3s'},
                            {value: 4, label: 'Delay 4s'},
                            {value: 5, label: 'Delay 5s'}],
                        selected: configuration.getData().delayEngEngID.sel
                    });
                    $rootScope.$broadcast("appUIApp.select.delayEngRusID.init", {
                        items: [{value: 0, label: 'Delay 0s'},
                            {value: 1, label: 'Delay 1s'},
                            {value: 2, label: 'Delay 2s'},
                            {value: 3, label: 'Delay 3s'},
                            {value: 4, label: 'Delay 4s'},
                            {value: 5, label: 'Delay 5s'}],
                        selected: configuration.getData().delayEngRusID.sel
                    });
                    $rootScope.$broadcast("appUIApp.button.confaddID.init", {
                        item: {
                            title: 'new',
                            callback: function (id) {
                                $rootScope.$broadcast("appUIApp.text.confID.get", function (data) {
                                    self.updateConfiguration();
                                    configuration.select(data.text);
                                    setTimeout(function () {
                                        reloadSetup();
                                    }, 100);
                                });
                            }
                        }
                    });
                    $rootScope.$broadcast("appUIApp.button.confdelID.init", {
                        item: {
                            title: 'del',
                            callback: function (id) {
                                $rootScope.$broadcast("appUIApp.text.confID.get", function (data) {
                                    if (configuration.selected != 'default') {
                                        configuration.unselect();
                                        setTimeout(function () {
                                            reloadSetup();
                                        }, 100);
                                    }
                                });
                            }
                        }
                    });
                    $rootScope.$broadcast("appUIApp.button.confsaveID.init", {
                        item: {
                            title: 'save',
                            callback: function (id) {
                                self.updateConfiguration();
                                setTimeout(function () {
                                    reloadSetup();
                                }, 100);
                            }
                        }
                    });
                    $rootScope.$broadcast("appUIApp.text.confID.init", {
                        item: {
                            title: '', text: configuration.selected, callback: null
                        }
                    });
                    var cnflist = [];
                    configuration.getList().every(function (val, ind) {
                        cnflist.push({value: val, label: val});
                        return true;
                    });
                    $rootScope.$broadcast("appUIApp.select.conflistID.init", {
                        items: cnflist,
                        selected: configuration.selected
                    });
                    $rootScope.$broadcast("infoController_init", {
                        text: ''
                    });
                });
                var selItems = [];
                $.each(self.dic.getItems(), function (ind, item) {
                    if (item.selected && item.leaf) {
                        selItems.push(item);
                    }
                });
                $injector.invoke(function ($rootScope) {
                    $rootScope.$broadcast("dictController_init", {
                        items: selItems,
                        ngSelClick: function() {
                            self.stopSound();
                        }
                    });
                });
            };

            this.initDictionaryWidgets = function () {
                injector.invoke(function ($rootScope) {
                    $rootScope.$broadcast("appUIApp.check.showRusDicID.init", {
                        item: {
                            title: ['', ''],
                            css: ['show-ua', 'show-ua-no'],
                            selected: configuration.getData().showRusID.sel
                        }
                    });
                    $rootScope.$broadcast("appUIApp.check.playRusDicID.init", {
                        item: {
                            title: ['', ''],
                            css: ['play-ua', 'play-ua-no'],
                            selected: configuration.getData().playRusID.sel
                        }
                    });
                    var prons = new Hashtable();
                    prons.put('br', 1);
                    prons.put('am', 0)
                    $rootScope.$broadcast("appUIApp.enum.pronDicID.init", {
                        items: [
                            {title: '', css: 'flag-icon-us flag-icon-30 corner-all-7'},
                            {title: '', css: 'flag-icon-br flag-icon-30 corner-all-7'}
                        ],
                        selected: prons.get(configuration.getData().pronID.sel)
                    });
                });
                var soundItems = [];
                mapSources.clear();
                sources = [];
                var cnf = configuration.getData();
                var allWordAmount = 0;
                $.each(self.dic.getItems(), function (ind, item) {
                    if (item.leaf) {
                        allWordAmount++;
                    }
                    if (item.selected && item.leaf) {
                        soundItems.push(item);
                        mapSources.put(item.name, item);

                        var eng = item.prop.get('eng');
                        var rus = item.prop.get('rus');
                        var traceID = 'trace.' + item.name + '.ID';
                        var jumpID = 'jump.' + item.name + '.ID';
                        var delay = cnf.delayEngEngID.sel;

                        var src = new FileManager().resolveFilePath('br/' + eng + '.mp3', configuration.getData().dicDirID.sel);
                        var source = new sound.Source(1, src, traceID, jumpID, delay);
                        item.prop.put('source-br', source);
                        sources.push(source);

                        src = new FileManager().resolveFilePath('am/' + eng + '.mp3', configuration.getData().dicDirID.sel);
                        source = new sound.Source(2, src, traceID, jumpID, delay);
                        sources.push(source);
                        item.prop.put('source-am', source);

                        src = new FileManager().resolveFilePath('ru/' + rus + '.mp3', cnf.dicDirID.sel);
                        delay = cnf.delayEngRusID.sel;
                        source = new sound.Source(4, src, traceID, jumpID, delay);
                        sources.push(source);
                        item.prop.put('source-ru', source);
                        item.prop.put('showrus', cnf.showRusID.sel);
                    }
                });
                self.sortDictionary(sources, soundItems);
                var text = '' + allWordAmount + '/' + soundItems.length;
                $injector.invoke(function ($rootScope) {
                    $rootScope.$broadcast("dictController_init", {
                        items: soundItems,
                        ngSelClick: function() {
                            self.stopSound();
                        }
                    });
                    $rootScope.$broadcast("infoController_init", {
                        text: text
                    });
                });
                soundManager.setCallbackError(self.doSoundError);
                soundManager.setFilter(filterToInt());
                soundManager.setSpeed(cnf.speedID.sel);
                soundManager.setSources(sources);
            };

            this.sortDictionary = function (sources, soundItems) {
                if (sortName == 'sortn') {
                } else if (sortName == 'sort123') {
                    sources.sort(function (a, b) {
                        var c = a.jumpID.localeCompare(b.jumpID);
                        return c == 0 ? a.src.localeCompare(b.src) : c;
                    });
                    soundItems.sort(function (a, b) {
                        return a.name.localeCompare(b.name);
                    });
                }
                if (sortName == 'sort321') {
                    sources.sort(function (a, b) {
                        var c = b.jumpID.localeCompare(a.jumpID);
                        return c == 0 ? a.src.localeCompare(b.src) : c;
                    });
                    soundItems.sort(function (a, b) {
                        return b.name.localeCompare(a.name);
                    });
                }
                if (sortName == 'sort132') {
                    sources.reverse();
                    soundItems.reverse();
                }
            }

            this.openSetup = function (injector) {
                $injector = injector;
                $callStack.next();
            };

            this.closeSetup = function () {
                self.updateConfiguration();
                $callStack.reset();
                $callStack.addFn('updateDictionary', self.updateDictionary);
                $callStack.addFn('initDictionaryWidgets', self.initDictionaryWidgets);
            };

            this.openDictionary = function (injector) {
                $injector = injector;
                $callStack.next();
            };

            this.closeDictionary = function () {
                self.stopSound();
                $callStack.reset();
                $callStack.addFn('updateDictionary', self.updateDictionary);
                $callStack.addFn('initSetupWidgets', self.initSetupWidgets);
            };

            this.stopSound = function () {
                if (!isNullOrUndef(currentPlayID)) {
                    $injector.invoke(function ($rootScope) {
                        $rootScope.$broadcast("appUIApp.enum." + currentPlayID + ".set", {
                            selected: 0
                        });
                    });
                }
                soundManager.stop();
            };

            this.doSoundError = function (error) {
                self.stopSound.apply(self);
                console.log('dialog: ' + error);
                openDialog('Sound manager', error);
            };

            this.playWord = function (id, sel, name) {
                if (sel == 1) {
                    self.stopSound.apply(self);
                    currentPlayID = id;
                    $injector.invoke(function ($rootScope) {
                        $rootScope.$broadcast("appUIApp.enum." + currentPlayID + ".set", {
                            selected: 1
                        });
                    });
                    var source = mapSources.get(name).prop.get('source-' + configuration.getData().pronID.sel);
                    soundManager.setSources([source]);
                    soundManager.play();
                } else {
                    self.stopSound.apply(self);
                    currentPlayID = null;
                }
            };

            $callStack.addFn('loadDictionary', this.loadDictionary);
            $callStack.addFn('updateDictionary', this.updateDictionary, []);
            $callStack.addFn('initDictionaryWidgets', this.initDictionaryWidgets);

            $callStack.next();
        }

        function Configuration() {
            this.selected = 'default';
            var $datas = {};
            var $def = {
                showRusID: {sel: true},
                playRusID: {sel: true},
                pronID: {sel: 'br'},
                delayEngEngID: {sel: 0},
                delayEngRusID: {sel: 0},
                speedID: {sel: 1.0},
                dicDirID: {sel: ''},
                wordID: []
            };
            var self = this;

            var load = function () {
                self.selected = localStorage.getItem('eng3000.configurations.selected');
                if (isNullOrUndef(self.selected)) {
                    self.selected = 'default';
                }
                var datas = localStorage.getItem('eng3000.configurations');
                if (!isNullOrUndef(datas)) {
                    $datas = angular.fromJson(datas);
                } else {
                    $datas = {};
                    $datas[self.selected] = $.extend({}, $def);
                }
            };
            load();

            this.getList = function () {
                var list = [];
                $.each($datas, function (key, val) {
                    list.push(key);
                });
                return list;
            };
            this.getData = function () {
                return $datas[self.selected];
            };
            this.save = function () {
                localStorage.setItem('eng3000.configurations.selected', self.selected);
                localStorage.setItem('eng3000.configurations', angular.toJson($datas));
                //localStorage.removeItem('eng3000.configurations.selected');
                //console.log('eng3000.store_setup.save: ' + angular.toJson($data));
            };
            this.select = function (name) {
                self.selected = isNullOrUndef(name) ? 'default' : name.toLowerCase();
                $datas[self.selected] = $.extend(true, {}, $def, $datas[self.selected]);
                self.save()
                load();
                return self.selected;
            };
            this.unselect = function () {
                if (self.selected == 'default') {
                    return;
                }
                if (!isNullOrUndef($datas[self.selected])) {
                    delete $datas[self.selected];
                }
                return self.select('default');
            };
        }

        appModule.controller('dictController', ['$scope', '$rootScope', function ($scope, $rootScope) {
            $scope.items = [];
            $scope.ngChecked = function (item) {
                return item.selected;
            };
            $scope.fnselClick;
            $scope.ngSelClick = function (item) {
                var i = configuration.getData().wordID.indexOf(item.name);
                item.selected = event.target.checked;
                if (item.selected && i == -1) {
                    configuration.getData().wordID.push(item.name);
                } else if (!item.selected && i != -1) {
                    configuration.getData().wordID.splice(i, 1);
                }
                var source = item.prop.get('source-br');
                if (!isNullOrUndef(source)) {
                    source.enabled = item.selected;
                }
                source = item.prop.get('source-am');
                if (!isNullOrUndef(source)) {
                    source.enabled = item.selected;
                }
                source = item.prop.get('source-ru');
                if (!isNullOrUndef(source)) {
                    source.enabled = item.selected;
                }
                configuration.save();
                if (!isNullOrUndef($scope.fnselClick)) {
                    $scope.fnselClick(item);
                }
            };
            $scope.ngShowRus = function (item) {
                var show = item.prop.get('showrus');
                return !isNullOrUndef(item.prop.get('showrus')) && show;
            };
            $rootScope.$on('dictController_init', function (event, data) {
                $scope.ngSelClick = data.ngSelClick;
                $scope.items = [];
                $scope.$apply();
                $scope.items = data.items;
                $scope.$apply();
            });
        }]);


        appModule.controller('infoController', ['$scope', '$rootScope', function ($scope, $rootScope) {
            $rootScope.$on('infoController_init', function (event, data) {
                $scope.text = data.text;
                $scope.$apply();
            });
        }]);

        function isNullOrUndef(arg) {
            return (arg === null || arg === void (0));
        };

        Setup.isNullOrUndef = function (arg) {
            return isNullOrUndef(arg);
        };

        Setup.toString = function (arg, def) {
            return Setup.isNullOrUndef(arg) ? def : '' + arg;
        };

        function openDialog(title, message) {
            $(function () {
                $("#dialog-message").text(message);
                $("#dialog-message").attr('title', title);
                $("#dialog-message").dialog({
                    modal: true,
                    buttons: {
                        Ok: function () {
                            $(this).dialog("close");
                        }
                    }
                });
            });
        }

        return Setup;
    });