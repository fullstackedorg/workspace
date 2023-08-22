const originalBlurRun = BlurAction.prototype.run;
BlurAction.prototype.run = function (...args){
    originalBlurRun(...args);

    if(window.parent !== window){
        window.parent.focus();
    }
}
KeybindingsRegistry.registerKeybindingRule({
    id: 'workbench.action.blur',
    primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyK,
    weight: KeybindingWeight.WorkbenchContrib
});
