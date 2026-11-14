export const DEFAULT_FEEDBACK = `上一轮正文问题很多：讲故事水平太差, 角色刻画不到位, 太过刻意俗套尬不自然，台词又尬又怪，逻辑不通，剧情和文风也有毛病。需要重写
写本轮正文前，先用<pre>...</pre>做一次预分析，挑出上一轮的问题。</pre>后空一行，再写<content>。

1. 角色刻画与心理, 行为逻辑有哪些问题（约1000字）
2. 台词（约500字）: 哪些台词尬,怪,不合理,逻辑有问题
3. 其他问题, 800字

每部分最后用一两句写出"本轮改法"。正文要照着这些改法写，不能分析完了照旧。`;

// Adapted from the user's Design Workbench revophone.5 control/measurement
// rules. This reviews the supplied design; it does not embed the tool card.
export const WORKBENCH_FEEDBACK = `请把上一版视为【设计工作台的待修订设计稿】，依据用户本轮原始需求、已提供的参考图、已确认设定和当前生效的模块规范，重新校核并交付一份完整修订稿。不要把工具设计任务改写成小说，也不要沿用原稿中与上述依据冲突的内容。

修订重点：
1. 范围与依据：先辨认本次实际要求的设计模块，只修订所需对象和字段。图片还原以可见款式、材质、色彩、剪裁、层次和结构为依据；不要因其他世界规则强行改变原设计。被遮挡、看不清或没有比例参照的内容，不编造成已知事实；未获补设授权的项目保留未设定。
2. 一致性：保留已确认且正确的名称、身份、类型、尺寸、功能和限制；修复前后矛盾、字段串项、条件遗漏与无法成立的穿戴结构。能力的触发条件、覆盖范围、代价和限制必须互相对应，不擅自新增能力或改变控制关系。行为逻辑与社会规则保持本次要求的泛用范围，不无故绑定参考图人物的外观或无关背景。
3. 尺寸校准：先统一测量对象、起止点、状态、单位与尺码体系，再依据已知参照确定区间，最后核对所选设计值落在区间内。同一人物使用同一尺度，不把投影宽度当周长，也不按一个固定比例推算所有部位。围差与所用尺码、长度与直径／周长分别核对。无尺度图片不能得到真实绝对尺寸，图片推定值只作为设计参数，不声称实测。正文采用数值和单位，不逐项追加估算后缀。
4. 输出格式：沿用当前模块实际规定的标题、字段顺序和 XML 标签，保证成对闭合、必填项齐全；无依据的可选栏目按模块要求省略整栏，不留下空标题，不另造一套模板。若正在使用 RevoPhone 格式，保持可识别栏目与单件物品边界，不能把 XML 设计稿冒充商城批量 JSON，也不虚构已上架、已购买或已执行操作。
5. 生图栏目：仅在本次要求时输出，身体、器官与服饰提示词各归其栏，不互相串入；身体栏只写身体自身特征，不混入衣物、姿势、场景、光照、镜头和画风，不添加质量词。已有同人身份按对应模块保留英文角色 Tag、作品消歧括号及所需 (cosplay) 标识，不把身份混进其他栏目。不凭中文名编造英文 Tag。

交付：直接输出可替换原稿的完整成品，不列问题清单，不附改稿说明、寒暄、总结或额外叙事。默认只输出一个完整的 markdown 代码块，内部保留所选模块的原有结构。只有用户本轮明确要求高精度／精准／测算／深度识图／cot 时，才可在代码块前用 <workbench_cot> 给出简短校准摘要，仅包含测量口径、可见参照、采用区间、最终设计值与未确定项；不输出逐步思维过程。用户本轮明确指定了其他交付格式时，遵循该格式。`;

const BUILTINS = [
    { id: 'default', name: '原作者默认', feedback: DEFAULT_FEEDBACK },
    { id: 'workbench', name: '设计工作台', feedback: WORKBENCH_FEEDBACK },
];
export const isBuiltinFeedback = id => BUILTINS.some(preset => preset.id === id);

export function normalizeFeedbackPresets(settings) {
    if (!Array.isArray(settings.feedbackPresets)) {
        settings.feedbackPresets = BUILTINS.map(preset => ({...preset}));
        settings.feedbackPreset = 'default';
        if (typeof settings.feedback === 'string' && settings.feedback !== DEFAULT_FEEDBACK) {
            settings.feedbackPresets.push({id: 'legacy', name: '原有修改意见', feedback: settings.feedback});
            settings.feedbackPreset = 'legacy';
        }
    }
    const seen = new Set();
    settings.feedbackPresets = settings.feedbackPresets.filter(preset => {
        if (!preset || typeof preset.id !== 'string' || !preset.id || seen.has(preset.id)
            || typeof preset.name !== 'string' || !preset.name.trim() || typeof preset.feedback !== 'string') return false;
        seen.add(preset.id); return true;
    });
    for (const builtin of BUILTINS) if (!seen.has(builtin.id)) settings.feedbackPresets.push({...builtin});
    const active = settings.feedbackPresets.find(preset => preset.id === settings.feedbackPreset) ?? settings.feedbackPresets[0];
    settings.feedbackPreset = active.id;
    settings.feedback = active.feedback;
    return settings;
}

export function editFeedback(settings, text) {
    normalizeFeedbackPresets(settings);
    settings.feedbackPresets.find(preset => preset.id === settings.feedbackPreset).feedback = String(text);
    settings.feedback = String(text);
}

function presetName(settings, name, except) {
    const value = String(name ?? '').trim();
    if (!value || value.length > 80) throw Error('请输入 1–80 个字符的预设名称');
    if (settings.feedbackPresets.some(preset => preset.id !== except && preset.name.toLocaleLowerCase() === value.toLocaleLowerCase())) {
        throw Error('已有同名预设，请换一个名称');
    }
    return value;
}

export function changeFeedbackPreset(settings, action, value) {
    normalizeFeedbackPresets(settings);
    const active = settings.feedbackPresets.find(preset => preset.id === settings.feedbackPreset);
    if (action === 'select') {
        if (!settings.feedbackPresets.some(preset => preset.id === value)) throw Error('这套修改意见已不存在');
        settings.feedbackPreset = value;
    } else if (action === 'save') {
        const name = presetName(settings, value);
        const id = globalThis.crypto?.randomUUID?.() ?? `feedback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        settings.feedbackPresets.push({id, name, feedback: settings.feedback});
        settings.feedbackPreset = id;
    } else if (action === 'rename') {
        if (isBuiltinFeedback(active.id)) throw Error('内置预设请另存为后重命名');
        active.name = presetName(settings, value, active.id);
    } else if (action === 'delete') {
        if (isBuiltinFeedback(active.id)) throw Error('内置预设不能删除');
        settings.feedbackPresets = settings.feedbackPresets.filter(preset => preset.id !== active.id);
        settings.feedbackPreset = 'default';
    } else if (action === 'reset') {
        const builtin = BUILTINS.find(preset => preset.id === active.id);
        if (!builtin) throw Error('只有内置预设可以恢复默认');
        active.feedback = builtin.feedback;
    } else throw Error('未知的预设操作');
    normalizeFeedbackPresets(settings);
}
