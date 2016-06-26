/**
 * @file movice
 * @author cgzero[cgzero@cgzero.com]
 * @data 2016-05-30
 */

/* globals Vue */

define(function (require) {
    var dom = require('saber-dom');
    var mvoice = require('../../src/mvoice');

    var URL_GET_SITE_DATA = '/demo/mock/getsitedataajax';

    var exports = {};

    var vm;
    var defaultList;
    var querys;

    /**
     * 获取站点信息和评论信息
     *
     * @inner
     */
    function getSiteData() {
        vm = new Vue({
            el: '#app',
            data: {
                mycomt: []
            },
            ready: function () {
                this.$set('host', 'http://koubei.baidu.com');
                this.$set('userphotoprefix', 'http://himg.bdimg.com/sys/portrait/item/');

                this.$http({
                    url: URL_GET_SITE_DATA,
                    method: 'GET'
                })
                .then(
                    function (res) {
                        var ret = res.data;
                        var status = ret.status;
                        var data = ret.data;

                        dom.removeClass(dom.g('app'), 'hide');

                        if (!status) {
                            defaultList = data.comtlist;
                            querys = data.querys;

                            this.$set('siteinfo', data.siteinfo);
                            this.$set('comtlist', defaultList);


                        }
                    }
                );
            },
            watch: {
                query: 'filterComt'
            },
            methods: {
                filterComt: function () {
                    var self = this;

                    for (var i = 0; i < querys.length; i++) {
                        var query = self.query.trim();
                        var reg = new RegExp(querys[i].key);

                        if (reg.test(query)) {
                            self.comtlist = querys[i].comt;
                            break;
                        }
                        else if (!query) {
                            self.comtlist = defaultList;
                        }
                        else {
                            self.comtlist = [];
                        }
                    }
                }
            }
        });
    }

    function initVoice() {
        mvoice.init({
            trigger: '#search-btn',
            oncomplete: function (result) {
                var input = dom.g('search-input');
                input.value = result;
                input.focus();
                input.blur();

                vm.mycomt = [];
            }
        });

        mvoice.init({
            trigger: '.kb-w',
            oncomplete: function (result) {
                vm.mycomt.unshift({
                    content: result
                });
            }
        });
    }

    exports.init = function () {
        getSiteData();
        initVoice();
    };

    return exports;

});
