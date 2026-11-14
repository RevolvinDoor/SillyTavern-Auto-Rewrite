// Optional protocol v1 for consumers such as RevoPhone. No host events are
// suppressed/re-emitted and no third-party message fields are modified.
const keyOf = ctx => `${ctx.groupId ?? ''}|${ctx.characterId ?? ''}|${ctx.getCurrentChatId() ?? ''}`;
const usable = m => m && !m.is_user && !m.is_system && m.mes?.trim() && m.mes.trim() !== '...';

export function createReplyDelivery(context, owner) {
    function waitForReply(id, type) {
        const ctx = context(), current = owner(), message = ctx.chat[Number(id)];
        if (!current || ![undefined, 'normal', 'regenerate', 'swipe'].includes(type) || Number(id) < 1 || ctx.groupId
            || Number(id) !== ctx.chat.length - 1 || current.key !== keyOf(ctx)
            || !message || message.is_user || message.is_system
            || (current.source && current.source !== message)) return null;
        if (!current.delivery) {
            let resolve;
            const promise = new Promise(done => { resolve = done; });
            current.delivery = { promise, resolve, key: keyOf(ctx), index: Number(id), message,
                swipeId: message.swipe_id ?? 0, text: message.mes, count: current.automatic !== false };
        }
        return current.delivery.promise;
    }

    function finish(current, accepted = false) {
        const d = current?.delivery;
        if (!d) return;
        delete current.delivery;
        const ctx = context(), message = ctx.chat[d.index];
        const ready = keyOf(ctx) === d.key && message === d.message && usable(message)
            && (accepted || ((message.swipe_id ?? 0) === d.swipeId && message.mes === d.text));
        d.resolve({ ready: Boolean(ready), count: d.count, key: d.key, index: d.index,
            message: d.message, swipeId: message?.swipe_id ?? 0, text: message?.mes });
    }

    return { waitForReply, finish };
}
