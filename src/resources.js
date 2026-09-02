const INVENTORY_PROMPT_MARKER = 'INVENTORY_STATE_JSON_BEGIN';

export const RESOURCE_TRACKING_RULE = `Finite-resource and possession accounting is part of Inventory state. If this response establishes that tracked money, food, water, ammunition, fuel, medicine, crafting supplies, charges, or other possessions were actually gained, spent, consumed, replenished, given away, lost, destroyed, or otherwise changed, update them in the same inventory control even when the user did not issue an OOC inventory command.
If the changing amount is stored directly in Quantity as a plain number, use adjust_item as normal. When the meaningful remaining amount or state is stored in an item's Remark while Quantity identifies the container or stock row, keep that Quantity unchanged and use edit_item to replace the Remark. Examples: Coin Pouch quantity "1" with remark "100 Gold", after spending 15 Gold, becomes remark "85 Gold"; Food quantity "1" with remark "About 7 days", after one established day of consumption, becomes remark "About 6 days"; a Waterskin quantity "1" may move from remark "Full" to "Half full" or "Empty" as its contents are actually used.
Preserve the authoritative unit and approximation style instead of inventing false precision. Only apply changes established as completed in this response; planned, attempted, negotiated, interrupted, or failed actions do not consume or grant resources unless the response explicitly establishes that they did.
When Remark-stored contents reach zero, preserve a durable container that still exists (for example Coin Pouch with "0 Gold" or Waterskin with "Empty"). If the row represents the consumable stock itself and none remains, delete that item instead of leaving ghost stock. Never produce a negative resource balance. If the authoritative amount cannot cover a completed use or payment, do not treat it as completed unless the response explicitly establishes another source or substitution.
If one event changes several inventory entries, such as paying for an item, eating while travelling, crafting from supplies, reloading ammunition, or receiving a reward, include all related inventory operations in the same patch so they commit atomically.`;

export function withResourceTrackingRule(prompt) {
    const text = String(prompt ?? '');
    if (!text || !text.includes(INVENTORY_PROMPT_MARKER)) return text;
    if (text.includes(RESOURCE_TRACKING_RULE)) return text;
    return `${text}\n${RESOURCE_TRACKING_RULE}`;
}
