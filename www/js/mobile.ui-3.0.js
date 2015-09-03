define('mobile.ui',
    ['jquery',
        'jquery-ui',
        'mobile-synch',
        'mobile-sound',
        "angular",
        "angular-ui",
        "mobile-file",
        "mobile-utils",
        "jquery-number"
    ],
    function ($, UI, CallStack, sound, angular, angularUI, FileManager, Utils) {
        var appModule = angular.module("app", ['angUIApp']);
        var configuration = new Configuration();
        var soundManager = new sound.SoundManager();

        function Setup(injector) {
            var dic;
            var $injector = injector;
            var self = this;
            var $callStack = new CallStack(this);
            var currentPlayID;
            var mapSources = new Hashtable();
            var sources;
            var sortName = 'sortn';
            var soundListener;

            var filterToInt = function () {
                var cnf = configuration.getData();
                var i = cnf.pronID.sel == 'br' ? 1 : 2;
                i += (cnf.playRusID.sel ? 4 : 0);
                i += (configuration.isPlayDic() ? 8 : 0);
                return i;
            };

            var reloadSetup = function () {
                Utils.blockUI();
                setTimeout(function () {
                    $callStack.reset();
                    $callStack.addFn('loadDictionary', self.loadDictionary);
                    $callStack.addFn('updateDictionary', self.updateDictionary, []);
                    $callStack.addFn('initSetupWidgets', self.initSetupWidgets);
                    $callStack.next();
                }, 500);
            };

            var reloadDictionaryWidget = function () {
                self.stopSound();
                Utils.blockUI();
                setTimeout(function () {
                    $callStack.reset();
                    $callStack.addFn('initDictionaryWidgets', self.initDictionaryWidgets);
                    $callStack.next();
                }, 500);
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
                        if (!Utils.isNullOrUndef(soundListener)) {
                            soundListener(soundManager.getState());
                        }
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
                    $rootScope.$broadcast("appUIApp.enum.sort2ID.set", {
                        selected: sorts.get(data.selected)
                    });
                    Utils.invokeLate('sortID', function () {
                        return self.getSortName();
                    }, reloadDictionaryWidget, 0);
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
                    var sorts = ['sortn', 'sort123', 'sort321', 'sort132'];
                    sortName = sorts[data.selected];
                    $rootScope.$broadcast("appUIApp.radio.sort1ID.set", {
                        selected: sortName
                    });
                    Utils.invokeLate('sortID', function () {
                        return self.getSortName();
                    }, reloadDictionaryWidget, 1000);
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
                    self.updateConfiguration();
                    configuration.select(data.selected);
                    setTimeout(function () {
                        reloadSetup();
                    }, 100);
                });
                $rootScope.$on("appUIApp.enum.pronDicID.selected", function (event, data) {
                    configuration.getData().pronID.sel = ['am', 'br'][data.selected];
                    self.stopSound();
                    Utils.blockUI();
                    soundManager.setFilter(filterToInt());
                    Utils.unblockUI();
                });
                $rootScope.$on("appUIApp.check.playRusDicID.selected", function (event, data) {
                    configuration.getData().playRusID.sel = data.selected;
                    self.stopSound();
                    Utils.blockUI();
                    soundManager.setFilter(filterToInt());
                    Utils.unblockUI();
                });
                $rootScope.$on("appUIApp.check.showRusDicID.selected", function (event, data) {
                    configuration.getData().showRusID.sel = data.selected;
                    configuration.save();
                    reloadDictionaryWidget();
                });
                $rootScope.$on("appUIApp.check.showTransDicID.selected", function (event, data) {
                    configuration.setShowTrans(data.selected);
                    reloadDictionaryWidget();
                });
                $rootScope.$on("appUIApp.check.playDicDicID.selected", function (event, data) {
                    configuration.setPlayDic(data.selected);
                    self.stopSound();
                    Utils.blockUI();
                    soundManager.setFilter(filterToInt());
                    Utils.unblockUI();
                });
                $rootScope.$on("appUIApp.radio.treeCheckedID.selected", function (event, data) {
                    configuration.setTreeChecked(data.selected);
                    $rootScope.$broadcast("appUIApp.tree.wordID.init", {
                        items: self.dic.getSortItems(),
                        fnSelect: configuration.getTreeChecked() == 'y' ? 'selectFunction' : null
                    });
                });
                $rootScope.$on("appUIApp.check.showTreeID.selected", function (event, data) {
                    configuration.setShowTree(data.selected);
                    reloadSetup();
                });
            });

            this.getSortName = function () {
                return sortName;
            };

            var buildDictionaryTree = function (jsonText) {
                var dic = new angularUI.TreeItems();
                var js = angular.fromJson(jsonText);
                if (!Utils.isNullOrUndef(js.$)) {
                    Utils.setEscapeSymbols(js.$.escape);
                }
                $.each(js, function (ind, val) {
                    if (ind != "$") {
                        var isLeaf = !Utils.isNullOrUndef(val.dict) && val.dict.length > 0;
                        dic.add(ind, false, false, val.title, val.dict);
                        if (isLeaf) {
                            $.each(val.dict, function (ind2, ws) {
                                var eng = ws[0];
                                var rus = ws[1];
                                var tr = ws[2];
                                var wds = ws[3];
                                var name = ind + "." + eng;
                                var treeItem = dic.add(name, false, true, Utils.escapeSymbol(eng));
                                treeItem.prop.put('src-eng', eng);
                                treeItem.prop.put('eng', Utils.escapeSymbol(eng));
                                var trans = Utils.toString(tr, '').split('|');
                                treeItem.prop.put('trans-am', Utils.toString(trans[0], ''));
                                treeItem.prop.put('trans-br', Utils.toString(trans[1], ''));
                                treeItem.prop.put('src-rus', Utils.toString(rus, ''));
                                treeItem.prop.put('rus', Utils.escapeSymbol(Utils.toString(rus, '')));
                                if (!Utils.isNullOrUndef(wds)) {
                                    var words = [];
                                    $.each(wds.split(','), function (ind3, w) {
                                        words.push({word: w.trim().toLowerCase()});
                                    });
                                    treeItem.prop.put('wds', words);
                                }
                            });
                        }
                    }
                });
                $injector.invoke(function ($rootScope) {
                    $rootScope.$broadcast("appUIApp.tree.wordID.init", {
                        items: configuration.isShowTree() ? dic.getSortItems(false) : dic.getSortItems(true),
                        fnSelect: configuration.getTreeChecked() == 'y' ? 'selectFunction' : null
                    });
                });
                return dic;
            };

            this.loadDictionary = function () {
                var url = configuration.getDicFile();
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
                if (!Utils.isNullOrUndef(self.dic)) {
                    $.each(self.dic.getItems(), function (ind, item) {
                        item.selected = configuration.getData().wordID.indexOf(item.name) != -1;
                    });
                }
            };

            this.updateConfiguration = function () {
                $injector.invoke(function ($rootScope) {
                    $rootScope.$broadcast("appUIApp.check.showTransID.get", function (data) {
                        configuration.setShowTrans(data.selected);
                    });
                    $rootScope.$broadcast("appUIApp.check.showRusID.get", function (data) {
                        configuration.getData().showRusID.sel = data.selected;
                    });
                    $rootScope.$broadcast("appUIApp.check.playRusID.get", function (data) {
                        configuration.getData().playRusID.sel = data.selected;
                    });
                    $rootScope.$broadcast("appUIApp.check.playDicID.get", function (data) {
                        configuration.setPlayDic(data.selected);
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
                    configuration.getData().wordID = [];
                    $.each(self.dic.getItems(), function (ind, item) {
                        if (item.selected) {
                            configuration.getData().wordID.push(item.name);
                        } else {
                            var i = configuration.getData().wordID.indexOf(item.name);
                            if (i != -1) {
                                configuration.getData().wordID.splice(i, i + 1);
                            }
                        }
                    });
                    $rootScope.$broadcast("appUIApp.text.dicDirID.get", function (data) {
                        configuration.getData().dicDirID.sel = data.text;
                    });
                    $rootScope.$broadcast("appUIApp.text.dicFileID.get", function (data) {
                        configuration.setDicFile(data.text);
                    });
                    $rootScope.$broadcast("appUIApp.radio.treeCheckedID.get", function (data) {
                        configuration.setTreeChecked(data.selected);
                    });
                    $rootScope.$broadcast("appUIApp.check.showTreeID.get", function (data) {
                        configuration.setShowTree(data.selected);
                    });

                });
                configuration.save();
            };

            this.initSetupWidgets = function () {
                injector.invoke(function ($rootScope) {
                    $rootScope.$broadcast("appUIApp.text.dicDirID.init", {
                        item: {
                            title: '',
                            disabled: configuration.isDefault(),
                            text: configuration.getData().dicDirID.sel,
                            callback: null
                        }
                    });
                    $rootScope.$broadcast("appUIApp.text.dicFileID.init", {
                        item: {
                            title: '',
                            disabled: configuration.isDefault(),
                            text: configuration.getDicFile(),
                            callback: null
                        }
                    });
                    $rootScope.$broadcast("appUIApp.radio.treeCheckedID.init", {
                        items: [{name: 'y', title: 'yes', css: 'ic-done-all'},
                            {name: 'n', title: 'no', css: 'ic-done'}],
                        selected: configuration.getTreeChecked()
                    });
                    $rootScope.$broadcast("appUIApp.check.showTreeID.init", {
                        item: {title: ['yes', 'no'], selected: configuration.isShowTree()}
                    });
                    //$rootScope.$broadcast("appUIApp.tree.wordID.init", {
                    //    items: self.dic.getSortItems(true),
                    //    fnSelect: configuration.getTreeChecked() == 'y' ? 'selectFunction' : null
                    //});
                    $rootScope.$broadcast("appUIApp.radio.pronID.init", {
                        items: [{name: 'am', title: 'am', css: 'flag-icon-us'}, {
                            name: 'br',
                            title: 'br',
                            css: 'flag-icon-br'
                        }],
                        selected: configuration.getData().pronID.sel
                    });
                    $rootScope.$broadcast("appUIApp.check.showTransID.init", {
                        item: {title: ['yes', 'no'], selected: configuration.isShowTrans()}
                    });
                    $rootScope.$broadcast("appUIApp.check.showRusID.init", {
                        item: {title: ['yes', 'no'], selected: configuration.getData().showRusID.sel}
                    });
                    $rootScope.$broadcast("appUIApp.check.playRusID.init", {
                        item: {title: ['yes', 'no'], selected: configuration.getData().playRusID.sel}
                    });
                    $rootScope.$broadcast("appUIApp.check.playDicID.init", {
                        item: {title: ['yes', 'no'], selected: configuration.isPlayDic()}
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
                                    configuration.add(data.text, configuration.getData());
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
                            disabled: configuration.isDefault(),
                            callback: function (id) {
                                var delFn = function () {
                                    configuration.unselect();
                                    setTimeout(function () {
                                        reloadSetup();
                                    }, 100);
                                };
                                if (!configuration.isDefault()) {
                                    confirmOpenDialog('Configuration', 'Are you want to delete?',
                                        'Delete', delFn);
                                }
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
                        ngSelClick: function () {
                            self.stopSound();
                        }
                    });
                });
                Utils.unblockUI();
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
                    $rootScope.$broadcast("appUIApp.check.showTransDicID.init", {
                        item: {
                            title: ['', ''],
                            css: ['transcript', 'transcript-no'],
                            selected: configuration.isShowTrans()
                        }
                    });
                    $rootScope.$broadcast("appUIApp.check.playRusDicID.init", {
                        item: {
                            title: ['', ''],
                            css: ['play-ua', 'play-ua-no'],
                            selected: configuration.getData().playRusID.sel
                        }
                    });
                    $rootScope.$broadcast("appUIApp.check.playDicDicID.init", {
                        item: {
                            title: ['', ''],
                            css: ['play-dic', 'play-dic-no'],
                            selected: configuration.isPlayDic()
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
                var uniqIndex = 0;
                var serviceParents = $injector.get('getParents');
                $.each(self.dic.getItems(), function (ind, item) {
                    var upSelected = true;
                    if (item.leaf) {
                        allWordAmount++;
                        var parents = serviceParents(item.name, self.dic.getItems());
                        $.each(parents, function (ind, prnt) {
                            upSelected &= prnt.selected;
                        });
                    }
                    //if (upSelected && item.selected && item.leaf) {
                    var itemVisible = !configuration.isShowTree() || item.selected;
                    if (upSelected && itemVisible && item.leaf) {
                        soundItems.push(item);
                        mapSources.put(item.name, item);

                        var eng = item.prop.get('eng');
                        var rus = item.prop.get('rus');
                        var src_eng = item.prop.get('src-eng');
                        var src_rus = item.prop.get('src-rus');
                        var traceID = 'trace.' + item.name + '.ID';
                        var jumpID = 'jump.' + item.name + '.ID';
                        var delay = cnf.delayEngEngID.sel;

                        var src = new FileManager().resolveFilePath('br/' + src_eng + '.mp3', configuration.getData().dicDirID.sel);
                        var source = new sound.Source(1, src, traceID, jumpID, delay);
                        item.prop.put('source-br', source);
                        sources.push(source);

                        src = new FileManager().resolveFilePath('am/' + src_eng + '.mp3', configuration.getData().dicDirID.sel);
                        source = new sound.Source(2, src, traceID, jumpID, delay);
                        sources.push(source);
                        item.prop.put('source-am', source);

                        src = new FileManager().resolveFilePath('ru/' + src_rus + '.mp3', cnf.dicDirID.sel);
                        delay = cnf.delayEngRusID.sel;
                        source = new sound.Source(4, src, traceID, jumpID, delay);
                        sources.push(source);
                        item.prop.put('source-ru', source);
                        item.prop.put('showrus', cnf.showRusID.sel);
                        item.prop.put('showtrans', configuration.isShowTrans());
                        var wds = item.prop.get('wds');
                        if (!Utils.isNullOrUndef(wds)) {
                            $.each(wds, function (ind2, wd) {
                                wd['id'] = 'wordplay2ID' + uniqIndex++;
                                src = new FileManager().resolveFilePath('br/' + wd.word + '.mp3', configuration.getData().dicDirID.sel);
                                wd['source-br'] = new sound.Source(8, src, 'span' + wd.id, wd.id, delay);
                                mapSources.put(item.name + '.' + wd.word, item);
                                src = new FileManager().resolveFilePath('am/' + wd.word + '.mp3', configuration.getData().dicDirID.sel);
                                wd['source-am'] = new sound.Source(8, src, 'span' + wd.id, wd.id, delay);
                            });
                        }
                    }
                });
                self.sortDictionary(sources, soundItems);
                var text = '' + allWordAmount + '/' + soundItems.length;
                $injector.invoke(function ($rootScope) {
                    $rootScope.$broadcast("dictController_init", {
                        items: soundItems,
                        ngSelClick: function () {
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
                Utils.unblockUI();
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
                Utils.blockUI()
                $callStack.reset();
                $callStack.addFn('updateDictionary', self.updateDictionary);
                $callStack.addFn('initSetupWidgets', self.initSetupWidgets);
                setTimeout(function () {
                    $injector = injector;
                    $callStack.next();
                }, 500);
            };

            this.closeSetup = function () {
                self.updateConfiguration();
            };

            this.openDictionary = function (injector) {
                Utils.blockUI();
                $callStack.reset();
                $callStack.addFn('updateDictionary', self.updateDictionary);
                $callStack.addFn('initDictionaryWidgets', self.initDictionaryWidgets);
                setTimeout(function () {
                    $injector = injector;
                    $callStack.next();
                }, 500);
            };

            this.closeDictionary = function () {
                self.stopSound();
            };

            this.stopSound = function () {
                if (!Utils.isNullOrUndef(currentPlayID)) {
                    $injector.invoke(function ($rootScope) {
                        $rootScope.$broadcast("appUIApp.enum." + currentPlayID + ".set", {
                            selected: 0
                        });
                    });
                }
                soundManager.stop();
                if (!Utils.isNullOrUndef(soundListener)) {
                    soundListener(this.getStateSound());
                }
            };

            this.pauseSound = function () {
                soundManager.pause();
            };

            this.switchSound = function () {
                var state = soundManager.getState();
                if (state == 'stop') {
                    return false;
                }
                if (state == 'play') {
                    soundManager.pause();
                    return true;
                } else if (state == 'pause') {
                    soundManager.resume();
                }
                return false;
            };

            this.getStateSound = function () {
                return soundManager.getState();
            };

            this.setSoundListener = function (listener) {
                soundListener = listener;
            }

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
                    var sources = [];
                    var item = mapSources.get(name);
                    var source = item.prop.get('source-' + configuration.getData().pronID.sel);
                    sources.push(source);
                    var words = item.prop.get('wds');
                    if (!Utils.isNullOrUndef(words) && words.length > 0) {
                        $.each(words, function (ind, item) {
                            var source = item['source-' + configuration.getData().pronID.sel];
                            sources.push(source);
                        });
                    }
                    soundManager.setSources(sources);
                    soundManager.play();
                } else {
                    self.stopSound.apply(self);
                    currentPlayID = null;
                }
            };

            this.playWord2 = function (id, items) {
                self.stopSound.apply(self);
                currentPlayID = id;
                $injector.invoke(function ($rootScope) {
                    $rootScope.$broadcast("appUIApp.enum." + currentPlayID + ".set", {
                        selected: 1
                    });
                });
                var sources = [];
                $.each(items, function (ind, item) {
                    var source = item['source-' + configuration.getData().pronID.sel];
                    sources.push(source);
                });
                soundManager.setSources(sources);
                soundManager.play();
            };

            this.spellPhraseDirect = function (id, sel, name) {
                if (sel == 0) {
                    $('p[direct="spell.direct.' + name + '"]').hide()
                    var els = $('a[spell="spell.' + name + '"]');
                    els.css("display", 'inline');
                    els.css("font-size", 'small');
                    els.css("line-height", '1.0');
                } else {
                    $('p[direct="spell.direct.' + name + '"]').show();
                    var els = $('a[spell="spell.' + name + '"]');
                    els.css("display", 'block');
                    els.css("font-size", 'large');
                    els.css("line-height", '1.5');
                }
            };

            var firstDate = new Date();
            var lastDate = new Date();
            setInterval(function () {
                lastDate = new Date();
                var diffDate = new Date(lastDate.getTime() - firstDate.getTime());
                $injector.invoke(function ($rootScope) {
                    $rootScope.$broadcast("infoController_init_duration", {
                        duration: diffDate.getUTCHours() + ':' + diffDate.getUTCMinutes() + ':' + diffDate.getUTCSeconds()
                    });
                });
            }, 1000);

            $callStack.addFn('loadDictionary', this.loadDictionary);
            $callStack.addFn('updateDictionary', this.updateDictionary, []);
            $callStack.addFn('initDictionaryWidgets', this.initDictionaryWidgets);
            $callStack.next();
        }

        function Configuration() {
            var self = this;
            this.selected = 'default';
            var $datas = {};
            var $def = {
                showRusID: {sel: true},
                playRusID: {sel: true},
                playDicID: {sel: false},
                showTransID: {sel: true},
                pronID: {sel: 'br'},
                treeCheckedID: {sel: 'y'},
                showTreeID: {sel: false},
                delayEngEngID: {sel: 0},
                delayEngRusID: {sel: 0},
                speedID: {sel: 1.0},
                dicDirID: {sel: ''},
                dicFileID: {sel: 'dictionary.json'},
                wordID: []
            };

            var load = function () {
                self.selected = localStorage.getItem('eng3000.configurations.selected');
                if (Utils.isNullOrUndef(self.selected)) {
                    self.selected = 'default';
                }
                var datas = localStorage.getItem('eng3000.configurations');
                if (!Utils.isNullOrUndef(datas)) {
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
            this.add = function (name, data) {
                if (Utils.isNullOrUndef(name) || name == '') {
                    openDialog('Configuration', 'The label can\'t be empty.');
                    return;
                }
                if (name == 'default') {
                    openDialog('Configuration', 'The label can\'t be modified for default.');
                    return;
                }
                var dublicate = false;
                $.each($datas, function (key, val) {
                    if (name == key) {
                        dublicate = true;
                        return false;
                    }
                });
                if (dublicate) {
                    openDialog('Configuration', 'The label already exists.');
                    return;
                }

                $datas[name] = $.extend(true, {}, $def, data);
                self.selected = name.toLowerCase();
                self.save();
                load();
                return self.selected;
            };
            this.select = function (name) {
                self.selected = Utils.isNullOrUndef(name) ? 'default' : name.toLowerCase();
                $datas[self.selected] = $.extend(true, {}, $def, $datas[self.selected]);
                self.save();
                load();
                return self.selected;
            };
            this.unselect = function () {
                if (self.isDefault()) {
                    return;
                }
                if (!Utils.isNullOrUndef($datas[self.selected])) {
                    delete $datas[self.selected];
                }
                return self.select('default');
            };
            this.isDefault = function () {
                return self.selected == 'default';
            };
            this.getDicFile = function () {
                var data = self.getData();
                if (Utils.isNullOrUndef(data.dicFileID) || self.isDefault()) {
                    data.dicFileID = {sel: 'dictionary.json'}
                }
                return data.dicFileID.sel;
            };
            this.setDicFile = function (value) {
                if (self.isDefault() && value != 'dictionary.json') {
                    openDialog('Configuration', 'value must be dictionary.json for default.');
                    return;
                }
                self.getData().dicFileID.sel = value;
            };
            this.isPlayDic = function () {
                var data = self.getData();
                if (Utils.isNullOrUndef(data.playDicID)) {
                    data.playDicID = {sel: false}
                }
                return data.playDicID.sel;
            };
            this.setPlayDic = function (value) {
                self.getData().playDicID.sel = value;
            };
            this.getTreeChecked = function () {
                var data = self.getData();
                if (Utils.isNullOrUndef(data.treeCheckedID)) {
                    data.treeCheckedID = {sel: 'y'}
                }
                return data.treeCheckedID.sel;
            };
            this.setTreeChecked = function (value) {
                self.getData().treeCheckedID.sel = value;
                self.save();
            };
            this.isShowTrans = function () {
                var data = self.getData();
                if (Utils.isNullOrUndef(data.showTransID)) {
                    data.showTransID = {sel: true}
                }
                return data.showTransID.sel;
            };
            this.setShowTrans = function (value) {
                self.getData().showTransID.sel = value;
                self.save();
            };
            this.isShowTree = function () {
                var data = self.getData();
                if (Utils.isNullOrUndef(data.showTreeID)) {
                    data.showTreeID = {sel: false}
                }
                return data.showTreeID.sel;
            };
            this.setShowTree = function (value) {
                self.getData().showTreeID.sel = value;
                self.save();
            };
        }

        appModule.controller('dictController', ['$scope', '$rootScope', function ($scope, $rootScope) {
            $scope.items = [];
            $scope.wds = function (item) {
                var arrWord = item.prop.get('wds');
                return Utils.isNullOrUndef(arrWord) || arrWord.length == 0 ? [] : arrWord;
            };
            $scope.play = function (playID, item, item2, thisName) {
                event.stopPropagation();
                var thisFn = eval(thisName);
                var expand = false;
                $rootScope.$broadcast("appUIApp.enum.spell.direct." + item.name + ".ID.get", function (data) {
                    expand = data.selected == 1
                });
                var items;
                if (expand) {
                    items = [];
                    items.push(item2);
                } else {
                    items = $scope.wds(item);
                }
                if (items.length > 0) {
                    thisFn.playWord2.call(thisFn, playID, items);
                }
            };
            $scope.ngShowDict = function (item) {
                return $scope.wds(item).length > 0;
            };
            $scope.ngChecked = function (item) {
                return item.selected;
            };
            $scope.fnselClick = null;
            $scope.ngSelClick = function (item) {
                var i = configuration.getData().wordID.indexOf(item.name);
                item.selected = event.target.checked;
                if (item.selected && i == -1) {
                    configuration.getData().wordID.push(item.name);
                } else if (!item.selected && i != -1) {
                    configuration.getData().wordID.splice(i, 1);
                }
                var source = item.prop.get('source-br');
                if (!Utils.isNullOrUndef(source)) {
                    source.enabled = item.selected;
                }
                source = item.prop.get('source-am');
                if (!Utils.isNullOrUndef(source)) {
                    source.enabled = item.selected;
                }
                source = item.prop.get('source-ru');
                if (!Utils.isNullOrUndef(source)) {
                    source.enabled = item.selected;
                }
                var spellItems = $scope.wds(item);
                $.each(spellItems, function (ind, spellItem) {
                    var source = spellItem['source-am'];
                    source.enabled = item.selected;
                    source = spellItem['source-br'];
                    source.enabled = item.selected;
                });
                configuration.save();
                if (!Utils.isNullOrUndef($scope.fnselClick)) {
                    $scope.fnselClick(item);
                }
            };
            $scope.ngShowRus = function (item) {
                var show = item.prop.get('showrus');
                return !Utils.isNullOrUndef(item.prop.get('showrus')) && show;
            };
            $scope.ngShowTrans = function (item) {
                var show = item.prop.get('showtrans');
                return !Utils.isNullOrUndef(item.prop.get('showtrans')) && show;
            };
            $scope.ngShowTrans = function (item) {
                var trans = item.prop.get('trans-' + configuration.getData().pronID.sel);
                var show = item.prop.get('showtrans');
                return !Utils.isNullOrUndef(trans) && trans != "" && !Utils.isNullOrUndef(show) && show;
            };
            $scope.getTrans = function (item) {
                var trans = item.prop.get('trans-' + configuration.getData().pronID.sel);
                return Utils.toString(trans, '');
            };
            $rootScope.$on('dictController_init', function (event, data) {
                $scope.fnselClick = data.ngSelClick;
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
            $rootScope.$on('infoController_init_duration', function (event, data) {
                $scope.duration = data.duration;
                $scope.$apply();
            });
        }]);

        function openDialog(title, message) {
            Utils.unblockUI();
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

        function confirmOpenDialog(title, message, name, fn) {
            Utils.unblockUI();
            var buttons = {
                Cancel: function () {
                    $(this).dialog("close");
                }
            };
            buttons[name] = function () {
                fn();
                $(this).dialog("close");
            };
            $("#dialog-message").text(message);
            $("#dialog-message").attr('title', title);
            $(function () {
                $("#dialog-message").dialog({
                    resizable: true,
                    modal: true,
                    buttons: buttons
                });
            });
        }

        return Setup;
    });