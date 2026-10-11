// MCP tool stub: every tool calls the API on-behalf-of a user.
// No DB credentials here by design (spec 01 F09).
export const TOOLS = ['majibill.reading.submit', 'majibill.bill.read', 'majibill.payment.status', 'majibill.me.manifest'] as const;
export type ToolName = (typeof TOOLS)[number];
