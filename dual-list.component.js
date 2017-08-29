import { Component, EventEmitter, Input, IterableDiffers, Output } from '@angular/core';
import { BasicList } from './basic-list';
var DualListComponent = (function () {
    function DualListComponent(differs) {
        this.differs = differs;
        this.key = typeof this.key !== 'undefined' ? this.key : '_id';
        this.display = typeof this.display !== 'undefined' ? this.display : '_name';
        this.height = typeof this.height !== 'undefined' ? this.height : '100px';
        this.filter = typeof this.filter !== 'undefined' ? this.filter : false;
        this.format = typeof this.format !== 'undefined' ? this.format : DualListComponent.DEFAULT_FORMAT;
        this.sort = typeof this.sort !== 'undefined' ? this.sort : false;
        this.compare = typeof this.compare !== 'undefined' ? this.compare : undefined;
        this.destinationChange = new EventEmitter();
        this.editItem = new EventEmitter();
        this.sorter = function (a, b) { return (a._name < b._name) ? -1 : ((a._name > b._name) ? 1 : 0); };
        this.available = new BasicList(DualListComponent.AVAILABLE_LIST_NAME);
        this.confirmed = new BasicList(DualListComponent.CONFIRMED_LIST_NAME);
    }
    DualListComponent.prototype.ngOnChanges = function (changeRecord) {
        if (changeRecord['filter']) {
            if (changeRecord['filter'].currentValue === false) {
                this.clearFilter(this.available);
                this.clearFilter(this.confirmed);
            }
        }
        if (changeRecord['sort']) {
            if (changeRecord['sort'].currentValue === true && this.compare === undefined) {
                this.compare = this.sorter;
            }
            else if (changeRecord['sort'].currentValue === false) {
                this.compare = undefined;
            }
        }
        if (changeRecord['format']) {
            this.format = changeRecord['format'].currentValue;
            if (typeof (this.format.direction) === 'undefined') {
                this.format.direction = DualListComponent.LTR;
            }
            if (typeof (this.format.add) === 'undefined') {
                this.format.add = DualListComponent.DEFAULT_FORMAT.add;
            }
            if (typeof (this.format.remove) === 'undefined') {
                this.format.remove = DualListComponent.DEFAULT_FORMAT.remove;
            }
            if (typeof (this.format.all) === 'undefined') {
                this.format.all = DualListComponent.DEFAULT_FORMAT.all;
            }
            if (typeof (this.format.none) === 'undefined') {
                this.format.none = DualListComponent.DEFAULT_FORMAT.none;
            }
        }
        if (changeRecord['source']) {
            this.available = new BasicList(DualListComponent.AVAILABLE_LIST_NAME);
            this.updatedSource();
            this.updatedDestination();
        }
        if (changeRecord['destination']) {
            this.confirmed = new BasicList(DualListComponent.CONFIRMED_LIST_NAME);
            this.updatedDestination();
            this.updatedSource();
        }
    };
    DualListComponent.prototype.ngDoCheck = function () {
        if (this.source && this.buildAvailable(this.source)) {
            this.onFilter(this.available);
        }
        if (this.destination && this.buildConfirmed(this.destination)) {
            this.onFilter(this.confirmed);
        }
    };
    DualListComponent.prototype.buildAvailable = function (source) {
        var _this = this;
        var sourceChanges = this.sourceDiffer.diff(source);
        if (sourceChanges) {
            sourceChanges.forEachRemovedItem(function (r) {
                var idx = _this.findItemIndex(_this.available.list, r.item, _this.key);
                if (idx !== -1) {
                    _this.available.list.splice(idx, 1);
                }
            });
            sourceChanges.forEachAddedItem(function (r) {
                if (_this.findItemIndex(_this.available.list, r.item, _this.key) === -1) {
                    _this.available.list.push({ _id: _this.makeId(r.item), _name: _this.makeName(r.item) });
                }
            });
            if (this.compare !== undefined) {
                this.available.list.sort(this.compare);
            }
            this.available.sift = this.available.list;
            return true;
        }
        return false;
    };
    DualListComponent.prototype.buildConfirmed = function (destination) {
        var _this = this;
        var destChanges = this.destinationDiffer.diff(destination);
        if (destChanges) {
            destChanges.forEachRemovedItem(function (r) {
                var idx = _this.findItemIndex(_this.confirmed.list, r.item, _this.key);
                if (idx !== -1) {
                    if (!_this.isItemSelected(_this.confirmed.pick, _this.confirmed.list[idx])) {
                        _this.selectItem(_this.confirmed.pick, _this.confirmed.list[idx]);
                    }
                    _this.moveItem(_this.confirmed, _this.available, _this.confirmed.list[idx]);
                }
            });
            destChanges.forEachAddedItem(function (r) {
                var idx = _this.findItemIndex(_this.available.list, r.item, _this.key);
                if (idx !== -1) {
                    if (!_this.isItemSelected(_this.available.pick, _this.available.list[idx])) {
                        _this.selectItem(_this.available.pick, _this.available.list[idx]);
                    }
                    _this.moveItem(_this.available, _this.confirmed, _this.available.list[idx]);
                }
            });
            if (this.compare !== undefined) {
                this.confirmed.list.sort(this.compare);
            }
            this.confirmed.sift = this.confirmed.list;
            return true;
        }
        return false;
    };
    DualListComponent.prototype.updatedSource = function () {
        this.available.list.length = 0;
        this.available.pick.length = 0;
        if (this.source !== undefined) {
            this.sourceDiffer = this.differs.find(this.source).create(null);
        }
    };
    DualListComponent.prototype.updatedDestination = function () {
        if (this.destination !== undefined) {
            this.destinationDiffer = this.differs.find(this.destination).create(null);
        }
    };
    DualListComponent.prototype.direction = function () {
        return this.format.direction === DualListComponent.LTR;
    };
    DualListComponent.prototype.dragEnd = function (list) {
        if (list === void 0) { list = null; }
        if (list) {
            list.dragStart = false;
        }
        else {
            this.available.dragStart = false;
            this.confirmed.dragStart = false;
        }
        return false;
    };
    DualListComponent.prototype.drag = function (event, item, list) {
        if (!this.isItemSelected(list.pick, item)) {
            this.selectItem(list.pick, item);
        }
        list.dragStart = true;
        event.dataTransfer.setData('text', item['_id']);
    };
    DualListComponent.prototype.allowDrop = function (event, list) {
        event.preventDefault();
        if (!list.dragStart) {
            list.dragOver = true;
        }
        return false;
    };
    DualListComponent.prototype.dragLeave = function () {
        this.available.dragOver = false;
        this.confirmed.dragOver = false;
    };
    DualListComponent.prototype.drop = function (event, list) {
        event.preventDefault();
        this.dragLeave();
        this.dragEnd();
        var id = event.dataTransfer.getData('text');
        var mv = list.list.filter(function (e) { return e._id === id; });
        if (mv.length > 0) {
            for (var i = 0, len = mv.length; i < len; i += 1) {
                list.pick.push(mv[i]);
            }
        }
        if (list === this.available) {
            this.moveItem(this.available, this.confirmed);
        }
        else {
            this.moveItem(this.confirmed, this.available);
        }
    };
    DualListComponent.prototype.trueUp = function () {
        var _this = this;
        var changed = false;
        var pos = this.destination.length;
        while ((pos -= 1) >= 0) {
            var mv = this.confirmed.list.filter(function (conf) {
                if (typeof _this.destination[pos] === 'object') {
                    return conf._id === _this.destination[pos][_this.key];
                }
                else {
                    return conf._id === _this.destination[pos];
                }
            });
            if (mv.length === 0) {
                this.destination.splice(pos, 1);
                changed = true;
            }
        }
        var _loop_1 = function (i, len) {
            var mv = this_1.destination.filter(function (d) {
                if (typeof d === 'object') {
                    return (d[_this.key] === _this.confirmed.list[i]._id);
                }
                else {
                    return (d === _this.confirmed.list[i]._id);
                }
            });
            if (mv.length === 0) {
                mv = this_1.source.filter(function (o) {
                    if (typeof o === 'object') {
                        return (o[_this.key] === _this.confirmed.list[i]._id);
                    }
                    else {
                        return (o === _this.confirmed.list[i]._id);
                    }
                });
                if (mv.length > 0) {
                    this_1.destination.push(mv[0]);
                    changed = true;
                }
            }
        };
        var this_1 = this;
        for (var i = 0, len = this.confirmed.list.length; i < len; i += 1) {
            _loop_1(i, len);
        }
        if (changed) {
            this.destinationChange.emit(this.destination);
        }
    };
    DualListComponent.prototype.findItemIndex = function (list, item, key) {
        if (key === void 0) { key = '_id'; }
        var idx = -1;
        function matchObject(e) {
            if (e._id === item[key]) {
                idx = list.indexOf(e);
                return true;
            }
            return false;
        }
        function match(e) {
            if (e._id === item) {
                idx = list.indexOf(e);
                return true;
            }
            return false;
        }
        if (typeof item === 'object') {
            list.filter(matchObject);
        }
        else {
            list.filter(match);
        }
        return idx;
    };
    DualListComponent.prototype.makeUnavailable = function (source, item) {
        var idx = source.list.indexOf(item);
        if (idx !== -1) {
            source.list.splice(idx, 1);
        }
    };
    DualListComponent.prototype.moveItem = function (source, target, item) {
        var _this = this;
        if (item === void 0) { item = null; }
        var i = 0;
        var len = source.pick.length;
        if (item) {
            i = source.list.indexOf(item);
            len = i + 1;
        }
        var _loop_2 = function () {
            var mv = [];
            if (item) {
                var idx = this_2.findItemIndex(source.pick, item);
                if (idx !== -1) {
                    mv[0] = source.pick[idx];
                }
            }
            else {
                mv = source.list.filter(function (src) {
                    return (src._id === source.pick[i]._id);
                });
            }
            if (mv.length === 1) {
                if (item && item._id === mv[0]._id) {
                    target.list.push(mv[0]);
                }
                else {
                    if (target.list.filter(function (trg) { return trg._id === mv[0]._id; }).length === 0) {
                        target.list.push(mv[0]);
                    }
                }
                this_2.makeUnavailable(source, mv[0]);
            }
        };
        var this_2 = this;
        for (; i < len; i += 1) {
            _loop_2();
        }
        if (this.compare !== undefined) {
            target.list.sort(this.compare);
        }
        source.pick.length = 0;
        this.trueUp();
        setTimeout(function () {
            _this.onFilter(source);
            _this.onFilter(target);
        }, 10);
    };
    DualListComponent.prototype.isItemSelected = function (list, item) {
        if (list.filter(function (e) { return Object.is(e, item); }).length > 0) {
            return true;
        }
        return false;
    };
    DualListComponent.prototype.shiftClick = function (event, index, source, item) {
        if (event.shiftKey && source.last && !Object.is(item, source.last)) {
            var idx = source.sift.indexOf(source.last);
            if (index > idx) {
                for (var i = (idx + 1); i < index; i += 1) {
                    this.selectItem(source.pick, source.sift[i]);
                }
            }
            else if (idx !== -1) {
                for (var i = (index + 1); i < idx; i += 1) {
                    this.selectItem(source.pick, source.sift[i]);
                }
            }
        }
        source.last = item;
    };
    DualListComponent.prototype.selectItem = function (list, item) {
        var pk = list.filter(function (e) {
            return Object.is(e, item);
        });
        if (pk.length > 0) {
            for (var i = 0, len = pk.length; i < len; i += 1) {
                var idx = list.indexOf(pk[i]);
                if (idx !== -1) {
                    list.splice(idx, 1);
                }
            }
        }
        else {
            list.push(item);
        }
    };
    DualListComponent.prototype.selectAll = function (source) {
        source.pick.length = 0;
        source.pick = source.sift.slice(0);
    };
    DualListComponent.prototype.selectNone = function (source) {
        source.pick.length = 0;
    };
    DualListComponent.prototype.isAllSelected = function (source) {
        if (source.list.length === 0 || source.list.length === source.pick.length) {
            return true;
        }
        return false;
    };
    DualListComponent.prototype.isAnySelected = function (source) {
        if (source.pick.length > 0) {
            return true;
        }
        return false;
    };
    DualListComponent.prototype.onEditItem = function (item) {
        this.editItem.emit(item);
    };
    DualListComponent.prototype.unpick = function (source) {
        for (var i = source.pick.length - 1; i >= 0; i -= 1) {
            if (source.sift.indexOf(source.pick[i]) === -1) {
                source.pick.splice(i, 1);
            }
        }
    };
    DualListComponent.prototype.clearFilter = function (source) {
        if (source) {
            source.picker = '';
            this.onFilter(source);
        }
    };
    DualListComponent.prototype.onFilter = function (source) {
        if (source.picker.length > 0) {
            var filtered = source.list.filter(function (item) {
                if (Object.prototype.toString.call(item) === '[object Object]') {
                    if (item._name !== undefined) {
                        return item._name.toLowerCase().indexOf(source.picker.toLowerCase()) !== -1;
                    }
                    else {
                        return JSON.stringify(item).toLowerCase().indexOf(source.picker.toLowerCase()) !== -1;
                    }
                }
                else {
                    return item.toLowerCase().indexOf(source.picker.toLowerCase()) !== -1;
                }
            });
            source.sift = filtered;
            this.unpick(source);
        }
        else {
            source.sift = source.list;
        }
    };
    DualListComponent.prototype.makeId = function (item) {
        if (typeof item === 'object') {
            return item[this.key];
        }
        else {
            return item;
        }
    };
    DualListComponent.prototype.makeName = function (item) {
        var display = this.display;
        function fallback(item) {
            switch (Object.prototype.toString.call(item)) {
                case '[object Number]':
                    return item;
                case '[object String]':
                    return item;
                default:
                    if (item !== undefined) {
                        return item[display];
                    }
                    else {
                        return 'undefined';
                    }
            }
        }
        var str = '';
        if (this.display !== undefined) {
            if (Object.prototype.toString.call(this.display) === '[object Array]') {
                for (var i = 0; i < this.display.length; i += 1) {
                    if (str.length > 0) {
                        str = str + '_';
                    }
                    if (this.display[i].indexOf('.') === -1) {
                        str = str + item[this.display[i]];
                    }
                    else {
                        var parts = this.display[i].split('.');
                        var s = item[parts[0]];
                        if (s) {
                            if (parts[1].indexOf('substring') !== -1) {
                                var nums = (parts[1].substring(parts[1].indexOf('(') + 1, parts[1].indexOf(')'))).split(',');
                                switch (nums.length) {
                                    case 1:
                                        str = str + s.substring(parseInt(nums[0], 10));
                                        break;
                                    case 2:
                                        str = str + s.substring(parseInt(nums[0], 10), parseInt(nums[1], 10));
                                        break;
                                    default:
                                        str = str + s;
                                        break;
                                }
                            }
                            else {
                                str = str + s;
                            }
                        }
                    }
                }
                return str;
            }
            else {
                return fallback(item);
            }
        }
        return fallback(item);
    };
    return DualListComponent;
}());
export { DualListComponent };
DualListComponent.AVAILABLE_LIST_NAME = 'available';
DualListComponent.CONFIRMED_LIST_NAME = 'confirmed';
DualListComponent.LTR = 'left-to-right';
DualListComponent.RTL = 'right-to-left';
DualListComponent.DEFAULT_FORMAT = { add: 'Add', remove: 'Remove', all: 'All', none: 'None', direction: DualListComponent.LTR };
DualListComponent.decorators = [
    { type: Component, args: [{
                selector: 'dual-list',
                styles: [
                    "div.record-picker {\n\toverflow-x: hidden;\n\toverflow-y: auto;\n\tborder: 1px solid #ddd;\n\tborder-radius:8px;\n\tposition: relative;\n\tcursor: pointer;\n}\n\n/* http://www.ourtuts.com/how-to-customize-browser-scrollbars-using-css3/ */\ndiv.record-picker::-webkit-scrollbar {\n\twidth: 12px;\n}\n\ndiv.record-picker::-webkit-scrollbar-button {\n\twidth: 0px;\n\theight: 0px;\n}\n\ndiv.record-picker {\n\tscrollbar-base-color: #337ab7;\n\tscrollbar-3dlight-color: #337ab7;\n\tscrollbar-highlight-color: #337ab7;\n\tscrollbar-track-color: #eee;\n\tscrollbar-arrow-color: gray;\n\tscrollbar-shadow-color: gray;\n\tscrollbar-dark-shadow-color: gray;\n}\n\ndiv.record-picker::-webkit-scrollbar-track {\n\tbackground:#eee;\n\tbox-shadow: 0px 0px 3px #dfdfdf inset;\n\tborder-top-right-radius: 8px;\n\tborder-bottom-right-radius: 8px;\n}\n\ndiv.record-picker::-webkit-scrollbar-thumb {\n\tbackground: #337ab7;\n\tborder: thin solid gray;\n\tborder-top-right-radius: 8px;\n\tborder-bottom-right-radius: 8px;\n}\n\ndiv.record-picker::-webkit-scrollbar-thumb:hover {\n\tbackground: #286090;\n}\n\n.record-picker ul {\n\tmargin: 0;\n\tpadding: 0 0 1px 0;\n}\n\n.record-picker li {\n\tborder-top: thin solid #ddd;\n\tborder-bottom: 1px solid #ddd;\n\tdisplay: block;\n\tpadding: 2px 2px 2px 10px;\n\tmargin-bottom: -1px;\n\tfont-size: 0.85em;\n\tcursor: pointer;\n\twhite-space: nowrap;\n\tmin-height:16px;\n}\n\n.record-picker li:hover {\n\tbackground-color: #f5f5f5;\n}\n\n.record-picker li.selected {\n\tbackground-color: #d9edf7;\n}\n\n.record-picker li.selected:hover {\n\tbackground-color: #c4e3f3;\n}\n\n.record-picker li.disabled {\n\topacity: 0.5;\n\tcursor: default;\n}\n\n.record-picker li:first-child {\n\tborder-top-left-radius: 8px;\n\tborder-top-right-radius: 8px;\n\tborder-top: none;\n}\n\n.record-picker li:last-child {\n\tborder-bottom-left-radius: 8px;\n\tborder-bottom-right-radius: 8px;\n\tborder-bottom: none;\n}\n\n.record-picker label {\n\tcursor: pointer;\n\tfont-weight: inherit;\n\tfont-size: 14px;\n\tpadding: 4px;\n\tmargin-bottom: -1px;\n\t-webkit-touch-callout: none;\n\t-webkit-user-select: none;\n\t-khtml-user-select: none;\n\t-moz-user-select: none;\n\t-ms-user-select: none;\n\tuser-select: none;\n}\n\n.record-picker ul.over {\n\tbackground-color:lightgray;\n}\n\n.record-picker ul li a {\n\tposition: absolute;\n\tright: 30px;\n\tpadding-top: 5px;\n}\n\n.dual-list  {\n\tdisplay: -webkit-box;\n\tdisplay: flex;\n\tflex-direction: row;\n\talign-content: flex-start;\n}\n\n.dual-list .listbox {\n\twidth: 50%;\n\tmargin: 0px;\n}\n\n.dual-list .button-bar {\n\tmargin-top: 8px;\n}\n\n/* &nbsp;&nbsp;&nbsp;&#9654; */\n.point-right::after {\n\tcontent: \"\\00A0\\00A0\\00A0\\25B6\";\n}\n\n/* &#9664;&nbsp;&nbsp;&nbsp; */\n.point-left::before {\n\tcontent: \"\\25C0\\00A0\\00A0\\00A0\";\n}\n\n.dual-list .button-bar button {\n\twidth: 47%;\n}\n\nbutton.btn-block {\n\tdisplay: block;\n\twidth: 100%;\n\tmargin-bottom: 8px;\n}\n\n.filter {\n\tmargin-bottom: -2.2em;\n}\n\n.filter::after {\n\tcontent:\"o\";\n\twidth:40px;\n\tcolor:transparent;\n\tfont-size:2em;\n\tbackground-image:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M0 64l192 192v192l128-32V256L512 64H0z\"/></svg>');\n\tbackground-repeat:no-repeat;\n\tbackground-position:center center;\n\topacity:.2;\n\ttop: -36px;\n\tleft: calc(100% - 21px);\n\tposition:relative;\n}\n\n\n"
                ],
                template: "\n<div class=\"dual-list\">\n\t<div class=\"listbox\" [ngStyle]=\"{ 'order' :  direction() ? 1 : 2, 'margin-left' : direction() ? 0 : '10px' }\">\n\t\t<button type=\"button\" name=\"addBtn\" class=\"btn btn-primary btn-block\"\n\t\t\t(click)=\"moveItem(available, confirmed)\" [ngClass]=\"direction() ? 'point-right' : 'point-left'\"\n\t\t\t[disabled]=\"available.pick.length === 0\">{{format.add}}</button>\n\n\t\t<form *ngIf=\"filter\" class=\"filter\">\n\t\t\t<input class=\"form-control\" name=\"filterSource\" [(ngModel)]=\"available.picker\" (ngModelChange)=\"onFilter(available)\">\n\t\t</form>\n\n\t\t<div class=\"record-picker\">\n\t\t\t<ul [ngStyle]=\"{'max-height': height, 'min-height': height}\" [ngClass]=\"{over:available.dragOver}\"\n\t\t\t\t(drop)=\"drop($event, confirmed)\" (dragover)=\"allowDrop($event, available)\" (dragleave)=\"dragLeave()\">\n\t\t\t\t<li *ngFor=\"let item of available.sift; let idx=index;\"\n\t\t\t\t\t(click)=\"selectItem(available.pick, item); shiftClick($event, idx, available, item)\"\n\t\t\t\t\t[ngClass]=\"{selected: isItemSelected(available.pick, item)}\"\n\t\t\t\t\tdraggable=\"true\" (dragstart)=\"drag($event, item, available)\" (dragend)=\"dragEnd(available)\"\n\t\t\t\t><label>{{item._name}}</label><a class=\"edit-item\" (click)=\"onEditItem(item)\">Edit</a></li>\n\t\t\t</ul>\n\t\t</div>\n\n\t\t<div class=\"button-bar\">\n\t\t\t<button type=\"button\" class=\"btn btn-primary pull-left\" (click)=\"selectAll(available)\"\n\t\t\t\t[disabled]=\"isAllSelected(available)\">{{format.all}}</button>\n\t\t\t<button type=\"button\" class=\"btn btn-default pull-right\" (click)=\"selectNone(available)\"\n\t\t\t\t[disabled]=\"!isAnySelected(available)\">{{format.none}}</button>\n\t\t</div>\n\t</div>\n\n\t<div class=\"listbox\" [ngStyle]=\"{ 'order' : direction() ? 2 : 1, 'margin-left' : direction() ? '10px' : 0 }\">\n\t\t<button type=\"button\" name=\"removeBtn\" class=\"btn btn-primary btn-block\"\n\t\t\t(click)=\"moveItem(confirmed, available)\" [ngClass]=\"direction() ? 'point-left' : 'point-right'\"\n\t\t\t[disabled]=\"confirmed.pick.length === 0\">{{format.remove}}</button>\n\n\t\t<form *ngIf=\"filter\" class=\"filter\">\n\t\t\t<input class=\"form-control\" name=\"filterDestination\" [(ngModel)]=\"confirmed.picker\" (ngModelChange)=\"onFilter(confirmed)\">\n\t\t</form>\n\n\t\t<div class=\"record-picker\">\n\t\t\t<ul [ngStyle]=\"{'max-height': height, 'min-height': height}\" [ngClass]=\"{over:confirmed.dragOver}\"\n\t\t\t\t(drop)=\"drop($event, available)\" (dragover)=\"allowDrop($event, confirmed)\" (dragleave)=\"dragLeave()\">\n\t\t\t\t<li *ngFor=\"let item of confirmed.sift; let idx=index;\"\n\t\t\t\t\t(click)=\"selectItem(confirmed.pick, item); shiftClick($event, idx, confirmed, item)\"\n\t\t\t\t\t[ngClass]=\"{selected: isItemSelected(confirmed.pick, item)}\"\n\t\t\t\t\tdraggable=\"true\" (dragstart)=\"drag($event, item, confirmed)\" (dragend)=\"dragEnd(confirmed)\"\n\t\t\t\t><label>{{item._name}}</label><a class=\"edit-item\" (click)=\"onEditItem(item)\">Edit</a></li>\n\t\t\t</ul>\n\t\t</div>\n\n\t\t<div class=\"button-bar\">\n\t\t\t<button type=\"button\" class=\"btn btn-primary pull-left\" (click)=\"selectAll(confirmed)\"\n\t\t\t\t[disabled]=\"isAllSelected(confirmed)\">{{format.all}}</button>\n\t\t\t<button type=\"button\" class=\"btn btn-default pull-right\" (click)=\"selectNone(confirmed)\"\n\t\t\t\t[disabled]=\"!isAnySelected(confirmed)\">{{format.none}}</button>\n\t\t</div>\n\t</div>\n</div>\n\n"
            },] },
];
DualListComponent.ctorParameters = function () { return [
    { type: IterableDiffers, },
]; };
DualListComponent.propDecorators = {
    'key': [{ type: Input },],
    'display': [{ type: Input },],
    'height': [{ type: Input },],
    'filter': [{ type: Input },],
    'format': [{ type: Input },],
    'sort': [{ type: Input },],
    'compare': [{ type: Input },],
    'source': [{ type: Input },],
    'destination': [{ type: Input },],
    'destinationChange': [{ type: Output },],
    'editItem': [{ type: Output },],
};
//# sourceMappingURL=dual-list.component.js.map