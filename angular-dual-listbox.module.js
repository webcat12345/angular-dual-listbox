import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DualListComponent } from './dual-list.component';
var AngularDualListBoxModule = (function () {
    function AngularDualListBoxModule() {
    }
    return AngularDualListBoxModule;
}());
export { AngularDualListBoxModule };
AngularDualListBoxModule.decorators = [
    { type: NgModule, args: [{
                imports: [
                    CommonModule,
                    FormsModule
                ],
                declarations: [DualListComponent],
                exports: [DualListComponent]
            },] },
];
AngularDualListBoxModule.ctorParameters = function () { return []; };
//# sourceMappingURL=angular-dual-listbox.module.js.map