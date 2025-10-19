// @ts-check
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { daebugIndex } from './templates/daebug-index.js';

let shutdownHandlersInstalled = false;
let rootPath = '';

/**
 * Install signal handlers to write shutdown message to daebug.md
 * @param {string} root - Root directory path
 */
export function installShutdownHandlers(root) {
  if (shutdownHandlersInstalled) return;
  
  rootPath = root;
  shutdownHandlersInstalled = true;
  
  // Handle Ctrl+C (SIGINT)
  process.on('SIGINT', () => {
    console.log('\n👾Received SIGINT (Ctrl+C), shutting down gracefully...');
    writeShutdownMessage('Interrupted by user (Ctrl+C)');
    process.exit(0);
  });
  
  // Handle termination signal (SIGTERM)
  process.on('SIGTERM', () => {
    console.log('\n👾Received SIGTERM, shutting down gracefully...');
    writeShutdownMessage('Terminated by system signal');
    process.exit(0);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('👾Uncaught exception:', err);
    writeShutdownMessage(`Crashed due to uncaught exception: ${err.message}`);
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('👾Unhandled rejection at:', promise, 'reason:', reason);
    writeShutdownMessage(`Crashed due to unhandled promise rejection`);
    process.exit(1);
  });
}

/**
 * Write shutdown message to daebug.md
 * @param {string} reason - Reason for shutdown
 */
function writeShutdownMessage(reason) {
  if (!rootPath) return;
  
  const daebugFile = join(rootPath, 'daebug.md');
  if (!existsSync(daebugFile)) return;
  
  try {
    const text = readFileSync(daebugFile, 'utf8');
    const startTimeMatch = text.match(/started (?:at )?(.+)/i);
    const startTime = startTimeMatch ? startTimeMatch[1] : 'unknown';
    
    const endTime = new Date().toString();
    
    const content = daebugIndex({
      startTime,
      endTime,
      isShutdown: true
    });
    
    writeFileSync(daebugFile, content, 'utf8');
    console.log(`👾Updated daebug.md with shutdown message: ${reason}`);
  } catch (err) {
    console.warn('👾Failed to write shutdown message:', err);
  }
}
