export declare class BasicList {
    private _name;
    last: any;
    picker: string;
    dragStart: boolean;
    dragOver: boolean;
    pick: Array<any>;
    list: Array<any>;
    sift: Array<any>;
    constructor(name: string);
    readonly name: string;
}
