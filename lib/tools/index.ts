/**
 * Tool implementations index
 * Exports all tool definitions organized by category
 */

import { deputyTools } from './deputy-tools.js';
import { propositionTools } from './proposition-tools.js';
import { votingTools } from './voting-tools.js';
import { committeeTools } from './committee-tools.js';
import { partyTools } from './party-tools.js';
import { eventTools } from './event-tools.js';
import { referenceTools } from './reference-tools.js';
import type { ToolDefinition } from '../core/tools.js';

/**
 * All tool definitions (62 total)
 * - Deputy tools: 15 tools
 * - Proposition tools: 10 tools
 * - Voting tools: 4 tools
 * - Committee tools: 5 tools
 * - Party tools: 6 tools
 * - Event tools: 7 tools
 * - Reference tools: 15 tools
 */
export const allTools: ToolDefinition[] = [
  ...deputyTools,
  ...propositionTools,
  ...votingTools,
  ...committeeTools,
  ...partyTools,
  ...eventTools,
  ...referenceTools,
];

/**
 * Export individual tool categories
 */
export { deputyTools } from './deputy-tools.js';
export { propositionTools } from './proposition-tools.js';
export { votingTools } from './voting-tools.js';
export { committeeTools } from './committee-tools.js';
export { partyTools } from './party-tools.js';
export { eventTools } from './event-tools.js';
export { referenceTools } from './reference-tools.js';
