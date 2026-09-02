const INVENTORY_PROMPT_MARKER = 'INVENTORY_STATE_JSON_BEGIN';

export const CURRENCY_TRACKING_RULE = `Currency/resource accounting is part of Inventory state. If this response establishes a completed purchase, payment, fee, tip, sale, reward, refund, theft, or other money gain/loss, update the relevant balance in the same inventory control even when the user did not issue an OOC inventory command.
When the spendable balance is stored in an item's Remark rather than Quantity, keep the container Quantity unchanged and use edit_item to replace the Remark with the newly calculated balance. Example: Coin Pouch quantity "1" with remark "100 Gold", after spending 15 Gold, must emit an edit_item for that exact Coin Pouch with remark "85 Gold". Receiving 20 Gold from that state must set remark "120 Gold".
A zero balance remains a valid container item, for example remark "0 Gold". Never produce a negative balance. If the authoritative balance cannot cover a payment, do not treat that payment as completed.
If a transaction also adds, removes, or changes an item, include the currency edit and the item operation in the same patch so they commit atomically.`;

export function withCurrencyTrackingRule(prompt) {
    const text = String(prompt ?? '');
    if (!text || !text.includes(INVENTORY_PROMPT_MARKER)) return text;
    if (text.includes(CURRENCY_TRACKING_RULE)) return text;
    return `${text}\n${CURRENCY_TRACKING_RULE}`;
}
