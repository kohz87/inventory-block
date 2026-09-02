const INVENTORY_PROMPT_MARKER = 'INVENTORY_STATE_JSON_BEGIN';

export const RESOURCE_TRACKING_RULE = `Finite-resource and possession accounting is part of Inventory state. If this response establishes that tracked money, food, water, ammunition, fuel, medicine, crafting supplies, charges, or other possessions were actually gained, spent, consumed, replenished, given away, lost, destroyed, or otherwise changed, update them in the same inventory control even when the user did not issue an OOC inventory command.
If the changing amount is stored directly in Quantity as a plain number, use adjust_item. If the meaningful remaining amount is a single numeric amount inside Remark while Quantity identifies the container or stock row, use adjust_resource with the signed change instead of calculating a replacement Remark yourself. Example: Coin Pouch quantity "1" with remark "100 Gold", after spending 15 Gold, use adjust_resource by -15 so the backend produces "85 Gold". Food quantity "1" with remark "About 7 days", after one established day of consumption, use adjust_resource by -1 so the backend preserves the approximation wording as "About 6 days". Set deleteAtZero:true only when the row is the consumable stock itself; leave it false/omitted for durable containers such as a Coin Pouch.
For non-numeric or semantic Remark states, use edit_item. A Waterskin quantity "1" may move from remark "Full" to "Half full" or "Empty" as its contents are actually used.
Preserve the authoritative unit and approximation style instead of inventing false precision. Only apply changes established as completed in this response; planned, attempted, negotiated, interrupted, or failed actions do not consume or grant resources unless the response explicitly establishes that they did.
Never produce or request a negative resource balance. Numeric Quantity and adjust_resource changes that would go below zero are rejected atomically by the backend. If the authoritative amount cannot cover a completed use or payment, do not treat it as completed unless the response explicitly establishes another source or substitution.
If one event changes several inventory entries, such as paying for an item, eating while travelling, crafting from supplies, reloading ammunition, or receiving a reward, include all related inventory operations in the same patch so they commit atomically.`;

export function withResourceTrackingRule(prompt) {
    const text = String(prompt ?? '');
    if (!text || !text.includes(INVENTORY_PROMPT_MARKER)) return text;
    if (text.includes(RESOURCE_TRACKING_RULE)) return text;
    return `${text}
${RESOURCE_TRACKING_RULE}`;
}
