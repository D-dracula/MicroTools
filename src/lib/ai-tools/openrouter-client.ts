/**
 * OpenRouter API Client
 * Handles communication with OpenRouter API for AI-powered tools
 * Supports Tool Use for accurate calculations
 * Requirements: 1.1, 1.3, 1.6
 */

import { 
  calculate, 
  calculateCostBreakdown, 
  calculateOrderProfit, 
  aggregateOrders,
  type CalculatorInput,
  type CostBreakdownInput 
} from '../math/financial-calculator';

// Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  enableCalculator?: boolean;
}

export interface ChatResponse {
  content: string;
  tokensUsed: number;
  cost: number;
  toolCalls?: ToolCall[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface OpenRouterError {
  code: string;
  message: string;
  retryAfter?: number;
}

// Constants
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'xiaomi/mimo-v2-flash:free';
const FALLBACK_MODELS = [
  'xiaomi/mimo-v2-flash:free',
  'qwen/qwen3-4b:free',
  'google/gemma-3-12b-it:free',
  'moonshotai/kimi-k2-instruct:free',
];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Token estimation (approximate: 1 token ≈ 4 characters for English, 2 for Arabic)
const CHARS_PER_TOKEN_EN = 4;
const CHARS_PER_TOKEN_AR = 2;

/**
 * Estimate token count for a given text
 * Uses character-based estimation with language detection
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  
  // Detect if text contains Arabic characters
  const arabicPattern = /[\u0600-\u06FF]/;
  const hasArabic = arabicPattern.test(text);
  
  // Use appropriate ratio based on language
  const charsPerToken = hasArabic ? CHARS_PER_TOKEN_AR : CHARS_PER_TOKEN_EN;
  
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Validate an OpenRouter API key
 */
export async function validateApiKey(apiKey: string): Promise<ValidationResult> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: 'API key is required' };
  }

  try {
    const response = await fetch(`${OPENROUTER_API_URL}/auth/key`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { valid: true };
    }

    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key. Please verify it was copied correctly.' };
    }
    
    if (response.status === 402) {
      return { valid: false, error: 'Insufficient OpenRouter credits. Please top up your account.' };
    }

    return { 
      valid: false, 
      error: errorData.error?.message || `Validation failed with status ${response.status}` 
    };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Network error during validation' 
    };
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse OpenRouter error response
 */
function parseError(status: number, data: Record<string, unknown>): OpenRouterError {
  const errorMessage = (data.error as { message?: string })?.message || 'Unknown error';
  
  switch (status) {
    case 401:
      return { code: 'INVALID_API_KEY', message: 'Invalid API key' };
    case 402:
      return { code: 'INSUFFICIENT_CREDITS', message: 'Insufficient credits' };
    case 429:
      const retryAfter = parseInt(String(data.retry_after || '60'), 10);
      return { code: 'RATE_LIMIT', message: 'Rate limit exceeded', retryAfter };
    case 408:
    case 504:
      return { code: 'API_TIMEOUT', message: 'Request timed out' };
    default:
      return { code: 'API_ERROR', message: errorMessage };
  }
}

/**
 * Send a chat request to OpenRouter API with retry logic
 */
export async function chat(
  apiKey: string,
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 4096,
    temperature = 0.7,
  } = options;

  let lastError: OpenRouterError | null = null;
  let currentModel = model;
  let modelIndex = FALLBACK_MODELS.indexOf(model);
  if (modelIndex === -1) modelIndex = 0;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://micro-tools.app',
          'X-Title': 'Micro-Tools AI',
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const choice = data.choices?.[0];
        
        if (!choice?.message?.content) {
          throw new Error('Invalid response format from API');
        }

        return {
          content: choice.message.content,
          tokensUsed: data.usage?.total_tokens || 0,
          cost: data.usage?.total_cost || 0,
        };
      }

      const errorData = await response.json().catch(() => ({}));
      lastError = parseError(response.status, errorData);

      // Handle rate limiting with wait
      if (lastError.code === 'RATE_LIMIT' && lastError.retryAfter) {
        await sleep(lastError.retryAfter * 1000);
        continue;
      }

      // Try fallback model on certain errors
      if (['API_ERROR', 'API_TIMEOUT'].includes(lastError.code)) {
        modelIndex++;
        if (modelIndex < FALLBACK_MODELS.length) {
          currentModel = FALLBACK_MODELS[modelIndex];
          continue;
        }
      }

      // Non-retryable errors
      if (['INVALID_API_KEY', 'INSUFFICIENT_CREDITS'].includes(lastError.code)) {
        throw new Error(lastError.message);
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes('API key')) {
        throw error;
      }
      lastError = { 
        code: 'NETWORK_ERROR', 
        message: error instanceof Error ? error.message : 'Network error' 
      };
    }

    // Wait before retry
    if (attempt < MAX_RETRIES - 1) {
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw new Error(lastError?.message || 'Failed to get response after multiple attempts');
}

/**
 * Get usage information for the API key
 */
export async function getUsage(apiKey: string): Promise<{ credits: number; used: number } | null> {
  try {
    const response = await fetch(`${OPENROUTER_API_URL}/auth/key`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        credits: data.data?.limit || 0,
        used: data.data?.usage || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Estimate cost for a given number of tokens
 * Free models - no cost
 */
export function estimateCost(inputTokens: number, outputTokens: number = 0): number {
  // Free models: $0/M input, $0/M output
  return 0;
}

/**
 * Calculator Tool Definition for AI Tool Use
 */
export const CALCULATOR_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'calculate',
    description: 'Perform precise financial calculations. Use this for ANY math operation instead of calculating yourself. Operations: add, subtract, multiply, divide, percentage, profit_margin, net_profit, roi, sum, average',
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['add', 'subtract', 'multiply', 'divide', 'percentage', 'profit_margin', 'net_profit', 'roi', 'sum', 'average'],
          description: 'The calculation operation to perform',
        },
        numbers: {
          type: 'array',
          items: { type: 'number' },
          description: 'Numbers for the calculation. For profit_margin: [profit, revenue]. For net_profit: [revenue, costs]. For roi: [gain, cost, investment]',
        },
      },
      required: ['operation', 'numbers'],
    },
  },
};

export const COST_BREAKDOWN_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'calculate_cost_breakdown',
    description: 'Calculate detailed cost breakdown with percentages for financial analysis',
    parameters: {
      type: 'object',
      properties: {
        revenue: {
          type: 'number',
          description: 'Total revenue amount',
        },
        costs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              amount: { type: 'number' },
            },
            required: ['category', 'amount'],
          },
          description: 'Array of cost items with category and amount',
        },
      },
      required: ['revenue', 'costs'],
    },
  },
};

export const ORDER_PROFIT_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'calculate_order_profit',
    description: 'Calculate profit analysis for a single order',
    parameters: {
      type: 'object',
      properties: {
        revenue: {
          type: 'number',
          description: 'Order revenue',
        },
        costs: {
          type: 'object',
          additionalProperties: { type: 'number' },
          description: 'Object with cost categories as keys and amounts as values',
        },
      },
      required: ['revenue', 'costs'],
    },
  },
};

export const AGGREGATE_ORDERS_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'aggregate_orders',
    description: 'Aggregate multiple orders to calculate totals',
    parameters: {
      type: 'object',
      properties: {
        orders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              revenue: { type: 'number' },
              costs: { type: 'number' },
            },
            required: ['revenue', 'costs'],
          },
          description: 'Array of orders with revenue and costs',
        },
      },
      required: ['orders'],
    },
  },
};

/**
 * All calculator tools for AI
 */
export const CALCULATOR_TOOLS: ToolDefinition[] = [
  CALCULATOR_TOOL,
  COST_BREAKDOWN_TOOL,
  ORDER_PROFIT_TOOL,
  AGGREGATE_ORDERS_TOOL,
];

/**
 * Execute a tool call and return the result
 */
export function executeToolCall(toolCall: ToolCall): string {
  const { name, arguments: argsStr } = toolCall.function;
  
  try {
    const args = JSON.parse(argsStr);
    
    switch (name) {
      case 'calculate': {
        const input: CalculatorInput = {
          operation: args.operation,
          numbers: args.numbers,
          options: args.options,
        };
        const result = calculate(input);
        return JSON.stringify(result);
      }
      
      case 'calculate_cost_breakdown': {
        const input: CostBreakdownInput = {
          revenue: args.revenue,
          costs: args.costs,
        };
        const result = calculateCostBreakdown(input);
        return JSON.stringify(result);
      }
      
      case 'calculate_order_profit': {
        const result = calculateOrderProfit(args.revenue, args.costs);
        return JSON.stringify(result);
      }
      
      case 'aggregate_orders': {
        const result = aggregateOrders(args.orders);
        return JSON.stringify(result);
      }
      
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    return JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Tool execution failed' 
    });
  }
}

/**
 * Chat with tool use support - handles tool calls automatically
 */
export async function chatWithTools(
  apiKey: string,
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 4096,
    temperature = 0.7,
    tools = CALCULATOR_TOOLS,
    enableCalculator = true,
  } = options;

  let currentMessages = [...messages];
  let totalTokens = 0;
  let iterations = 0;
  const maxIterations = 5; // Prevent infinite loops

  console.log('\n🔧 [chatWithTools] Starting with Tool Use support');
  console.log(`   Model: ${model}`);
  console.log(`   Tools enabled: ${enableCalculator}`);
  console.log(`   Available tools: ${tools.map(t => t.function.name).join(', ')}`);

  while (iterations < maxIterations) {
    iterations++;
    console.log(`\n   📤 [Iteration ${iterations}] Sending request to AI...`);

    const requestBody: Record<string, unknown> = {
      model,
      messages: currentMessages,
      max_tokens: maxTokens,
      temperature,
    };

    // Add tools if enabled
    if (enableCalculator && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
    }

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://micro-tools.app',
        'X-Title': 'Micro-Tools AI',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log(`   ❌ API Error: ${response.status}`, errorData);
      throw new Error(parseError(response.status, errorData).message);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    totalTokens += data.usage?.total_tokens || 0;
    console.log(`   📥 Response received. Tokens: ${data.usage?.total_tokens || 0}`);

    // Check if AI wants to use tools
    if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
      console.log(`   🔧 [Tool Use] AI requested ${choice.message.tool_calls.length} tool(s):`);
      
      // Add assistant message with tool calls
      currentMessages.push({
        role: 'assistant',
        content: choice.message.content || '',
        ...({ tool_calls: choice.message.tool_calls } as Record<string, unknown>),
      } as ChatMessage);

      // Execute each tool call and add results
      for (const toolCall of choice.message.tool_calls) {
        console.log(`      🧮 Executing: ${toolCall.function.name}`);
        console.log(`         Input: ${toolCall.function.arguments}`);
        const result = executeToolCall(toolCall);
        console.log(`         Result: ${result.substring(0, 150)}${result.length > 150 ? '...' : ''}`);
        currentMessages.push({
          role: 'tool',
          content: result,
          tool_call_id: toolCall.id,
        });
      }

      // Continue the loop to get final response
      continue;
    }

    // No tool calls, return the response
    if (!choice?.message?.content) {
      console.log('   ❌ Invalid response format');
      throw new Error('Invalid response format from API');
    }

    console.log(`   ✅ Final response received (no more tool calls)`);
    console.log(`   📊 Total tokens used: ${totalTokens}`);

    return {
      content: choice.message.content,
      tokensUsed: totalTokens,
      cost: data.usage?.total_cost || 0,
    };
  }

  console.log('   ❌ Max iterations reached');
  throw new Error('Max iterations reached in tool use loop');
}
