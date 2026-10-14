#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

const server = createServer();
await server.connect(new StdioServerTransport());
// stdout is the protocol channel; log to stderr only.
console.error('verity-design-system MCP server ready on stdio');
