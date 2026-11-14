import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DEFAULT_FEEDBACK,WORKBENCH_FEEDBACK,normalizeFeedbackPresets,editFeedback,changeFeedbackPreset} from '../feedback-presets.js';

test('first use includes two built-ins and retains the original default verbatim', () => {
    // Frozen against the 3.1.2 source before the constant was moved.
    assert.equal(createHash('sha256').update(DEFAULT_FEEDBACK).digest('hex'), '56ff71c99f4a9af669f58684ba5eb790fba4f37f6d995f1ba324c9ddf254cf34');
    const settings = normalizeFeedbackPresets({auto:false, model:'saved-model'});
    assert.equal(settings.feedbackPreset,'default'); assert.equal(settings.feedback,DEFAULT_FEEDBACK);
    assert.deepEqual(settings.feedbackPresets.map(p => p.name),['原作者默认','设计工作台']);
    assert.equal(settings.auto,false); assert.equal(settings.model,'saved-model');
});

for (const feedback of ['用户自己的整段意见\n下一行', '', '  原有空格  ']) {
    test(`legacy feedback migrates without alteration (${JSON.stringify(feedback)})`, () => {
        const s = normalizeFeedbackPresets({feedback});
        assert.equal(s.feedbackPreset,'legacy'); assert.equal(s.feedback,feedback);
        normalizeFeedbackPresets(s); assert.equal(s.feedbackPresets.length,3);
        assert.equal(s.feedbackPresets.find(p=>p.id==='legacy').feedback,feedback);
    });
}

test('copies, edits, selection and reload preserve separate preset contents', () => {
    const s=normalizeFeedbackPresets({});
    changeFeedbackPreset(s,'save','  我的方案  ');const id=s.feedbackPreset;
    editFeedback(s,'我的新意见');changeFeedbackPreset(s,'select','workbench');
    assert.equal(s.feedback,WORKBENCH_FEEDBACK);editFeedback(s,'工作台定制稿');
    const restored=normalizeFeedbackPresets(JSON.parse(JSON.stringify(s)));
    assert.equal(restored.feedback,'工作台定制稿');
    changeFeedbackPreset(restored,'select',id);assert.equal(restored.feedback,'我的新意见');
    changeFeedbackPreset(restored,'rename','重命名');assert.equal(restored.feedbackPresets.find(p=>p.id===id).name,'重命名');
    changeFeedbackPreset(restored,'delete');assert.equal(restored.feedbackPreset,'default');
    assert.equal(restored.feedback,DEFAULT_FEEDBACK);
    changeFeedbackPreset(restored,'select','workbench');changeFeedbackPreset(restored,'reset');
    assert.equal(restored.feedback,WORKBENCH_FEEDBACK);
});

test('invalid operations cannot overwrite another preset or delete built-ins', () => {
    const s=normalizeFeedbackPresets({});
    for(const [action,value] of [['save',''],['save',' '.repeat(2)],['save','x'.repeat(81)],['save','原作者默认'],['delete'],['rename','改名'],['select','missing']]) {
        const before=JSON.stringify(s);assert.throws(()=>changeFeedbackPreset(s,action,value));assert.equal(JSON.stringify(s),before);
    }
    changeFeedbackPreset(s,'save','Test');const before=JSON.stringify(s);
    assert.throws(()=>changeFeedbackPreset(s,'save','test'));assert.equal(JSON.stringify(s),before);
});

test('workbench prompt uses bounded calibration and supplied schema without forcing narrative wrappers', () => {
    for(const word of ['未设定','区间','XML','(cosplay)','单件','校准摘要','不输出逐步思维过程']) assert.ok(WORKBENCH_FEEDBACK.includes(word));
    assert.ok(!WORKBENCH_FEEDBACK.includes('<pre>'));assert.ok(!WORKBENCH_FEEDBACK.includes('<content>'));
    assert.ok(!WORKBENCH_FEEDBACK.includes('1000字'));
});
