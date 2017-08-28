var BasicList = (function () {
    function BasicList(name) {
        this._name = name;
        this.last = null;
        this.picker = '';
        this.dragStart = false;
        this.dragOver = false;
        this.pick = [];
        this.list = [];
        this.sift = [];
    }
    Object.defineProperty(BasicList.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });
    return BasicList;
}());
export { BasicList };
//# sourceMappingURL=basic-list.js.map