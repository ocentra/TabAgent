/// <reference lib="dom" />

const prefix = '[PipelineHelpers]';

// Logging flags
const LOG_GENERAL = false;

/**
 * PipelineHelpers - Utility functions for pipeline operations
 * Shared helper functions that can be used across different pipelines
 */
export class PipelineHelpers {
  /**
   * Filter scraped content from messages
   * Extracts only essential fields from scraped data to reduce token usage
   * 
   * @param messages - Array of chat messages
   * @returns Filtered messages with cleaned scraped content
   */
  static filterScrapedContent(
    messages: Array<{ role: string; content: string }>
  ): Array<{ role: string; content: string }> {
    if (LOG_GENERAL) {
      console.log(prefix, `[filterScrapedContent] Processing ${messages.length} messages`);
    }

    return messages.map((msg, index) => {
      let content = msg.content.trim();
      let isJsonContent = false;
      let jsonData = null;

      // Check for markdown-wrapped JSON (```json ... ```)
      if (content.startsWith('```json') && content.endsWith('```')) {
        try {
          const jsonStart = content.indexOf('```json') + 7; // Skip ```json
          const jsonEnd = content.lastIndexOf('```');
          const jsonString = content.substring(jsonStart, jsonEnd).trim();
          jsonData = JSON.parse(jsonString);
          isJsonContent = true;
        } catch (error) {
          // If JSON parsing fails, treat as regular content
        }
      }
      // Check for direct JSON (starts with { and ends with })
      else if (content.startsWith('{') && content.endsWith('}')) {
        try {
          jsonData = JSON.parse(content);
          isJsonContent = true;
        } catch (error) {
          // If JSON parsing fails, treat as regular content
        }
      }

      // Check for scraped data patterns
      const isScrapedData =
        isJsonContent &&
        jsonData &&
        (jsonData.method === 'tempTabExecuteScript' ||
          jsonData.extractedAt ||
          jsonData.wordCount ||
          jsonData.readingTime ||
          jsonData.segments ||
          jsonData.images ||
          jsonData.links);

      if (isScrapedData) {
        // Extract only essential fields
        const filteredContent = {
          title: jsonData.title || 'Untitled',
          text: jsonData.text || jsonData.content || '',
          url: jsonData.url || '',
        };

        const newContent = `Title: ${filteredContent.title}\nURL: ${filteredContent.url}\nContent: ${filteredContent.text}`;

        // Return clean, minimal content
        return {
          ...msg,
          content: newContent,
        };
      }

      // Return original content if not scraped data
      return msg;
    });
  }

  /**
   * Truncate messages to fit within token limit
   * Keeps system message and recent messages, truncates older ones
   * 
   * @param messages - Array of chat messages
   * @param maxTokens - Maximum number of tokens (approximate)
   * @param tokensPerChar - Approximate tokens per character (default: 0.25)
   * @returns Truncated messages
   */
  static truncateMessages(
    messages: Array<{ role: string; content: string }>,
    maxTokens: number,
    tokensPerChar: number = 0.25
  ): Array<{ role: string; content: string }> {
    if (messages.length === 0) return messages;

    // Separate system message from others
    const systemMessages = messages.filter((msg) => msg.role === 'system');
    const nonSystemMessages = messages.filter((msg) => msg.role !== 'system');

    // Calculate approximate tokens
    const estimateTokens = (text: string) => Math.ceil(text.length * tokensPerChar);

    let totalTokens = systemMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
    const result: Array<{ role: string; content: string }> = [...systemMessages];

    // Add messages from most recent, working backwards
    for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
      const msg = nonSystemMessages[i];
      const msgTokens = estimateTokens(msg.content);

      if (totalTokens + msgTokens <= maxTokens) {
        result.unshift(msg);
        totalTokens += msgTokens;
      } else {
        // Stop if we exceed limit
        break;
      }
    }

    // Re-sort to maintain chronological order (system first, then chronological)
    const systemMsgs = result.filter((msg) => msg.role === 'system');
    const otherMsgs = result.filter((msg) => msg.role !== 'system');
    
    return [...systemMsgs, ...otherMsgs];
  }

  /**
   * Validate message format
   * Ensures messages have required fields and valid roles
   * 
   * @param messages - Array of messages to validate
   * @returns True if valid, false otherwise
   */
  static validateMessages(messages: Array<{ role: string; content: string }>): boolean {
    if (!Array.isArray(messages)) {
      if (LOG_GENERAL) {
        console.error(prefix, '[validateMessages] Messages is not an array');
      }
      return false;
    }

    const validRoles = ['system', 'user', 'assistant'];

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        if (LOG_GENERAL) {
          console.error(prefix, '[validateMessages] Message missing role or content:', msg);
        }
        return false;
      }

      if (!validRoles.includes(msg.role)) {
        if (LOG_GENERAL) {
          console.error(prefix, '[validateMessages] Invalid role:', msg.role);
        }
        return false;
      }

      if (typeof msg.content !== 'string') {
        if (LOG_GENERAL) {
          console.error(prefix, '[validateMessages] Content is not a string:', msg);
        }
        return false;
      }
    }

    return true;
  }

  /**
   * Clean whitespace from messages
   * Trims excessive whitespace and normalizes line breaks
   * 
   * @param messages - Array of messages
   * @returns Messages with cleaned content
   */
  static cleanMessages(
    messages: Array<{ role: string; content: string }>
  ): Array<{ role: string; content: string }> {
    return messages.map((msg) => ({
      ...msg,
      content: msg.content
        .trim()
        .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
        .replace(/[ \t]+/g, ' '), // Normalize spaces/tabs
    }));
  }

  /**
   * Add system message if not present
   * 
   * @param messages - Array of messages
   * @param systemPrompt - System prompt to add
   * @returns Messages with system prompt
   */
  static ensureSystemPrompt(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string
  ): Array<{ role: string; content: string }> {
    const hasSystemMessage = messages.some((msg) => msg.role === 'system');

    if (!hasSystemMessage && systemPrompt && systemPrompt.trim().length > 0) {
      return [{ role: 'system', content: systemPrompt }, ...messages];
    }

    return messages;
  }
}
