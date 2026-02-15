// types/agent-bridge.ts

/**
 * Message types for bidirectional communication between UI and Agent
 */

// ============================================================================
// Base Message Types
// ============================================================================

export enum MessageDirection {
  TO_AGENT = "to_agent",
  TO_UI = "to_ui",
}

export enum MessageTopic {
  // UI → Agent topics
  CONTEXT_CHANGE = "ui:context",
  FORM_UPDATE = "ui:form",
  USER_ACTION = "ui:action",
  PAGE_EVENT = "ui:event",

  // Agent → UI topics
  UI_COMMAND = "agent:command",
  FORM_PREFILL = "agent:form",
  NAVIGATION = "agent:navigation",
  TASK_TRIGGER = "agent:task",
}

export interface BaseMessage {
  id: string;
  timestamp: number;
  topic: MessageTopic;
  direction: MessageDirection;
}

// ============================================================================
// UI → Agent Messages
// ============================================================================

/**
 * Context types in the application
 */
export type AppContext = "home" | "booking" | "ordering" | "profile" | "support" | string;

export interface ContextChangeMessage extends BaseMessage {
  topic: MessageTopic.CONTEXT_CHANGE;
  direction: MessageDirection.TO_AGENT;
  payload: {
    from: AppContext | null;
    to: AppContext;
    metadata?: Record<string, any>;
  };
}

export interface FormUpdateMessage extends BaseMessage {
  topic: MessageTopic.FORM_UPDATE;
  direction: MessageDirection.TO_AGENT;
  payload: {
    context: AppContext;
    formId: string;
    field: string;
    value: any;
    allValues: Record<string, any>;
  };
}

export interface UserActionMessage extends BaseMessage {
  topic: MessageTopic.USER_ACTION;
  direction: MessageDirection.TO_AGENT;
  payload: {
    context: AppContext;
    action: string;
    data?: Record<string, any>;
  };
}

export interface PageEventMessage extends BaseMessage {
  topic: MessageTopic.PAGE_EVENT;
  direction: MessageDirection.TO_AGENT;
  payload: {
    context: AppContext;
    event: string;
    data?: Record<string, any>;
  };
}

export type ToAgentMessage =
  | ContextChangeMessage
  | FormUpdateMessage
  | UserActionMessage
  | PageEventMessage;

// ============================================================================
// Agent → UI Messages
// ============================================================================

export type UICommandType = "navigate" | "show" | "hide" | "scroll" | "focus" | "submit" | string;

export interface UICommandMessage extends BaseMessage {
  topic: MessageTopic.UI_COMMAND;
  direction: MessageDirection.TO_UI;
  payload: {
    command: UICommandType;
    target?: string;
    data?: Record<string, any>;
  };
}

export interface FormPrefillMessage extends BaseMessage {
  topic: MessageTopic.FORM_PREFILL;
  direction: MessageDirection.TO_UI;
  payload: {
    context: AppContext;
    formId: string;
    values: Record<string, any>;
    merge?: boolean; // If true, merge with existing values
  };
}

export interface NavigationMessage extends BaseMessage {
  topic: MessageTopic.NAVIGATION;
  direction: MessageDirection.TO_UI;
  payload: {
    to: AppContext;
    route?: string;
    metadata?: Record<string, any>;
  };
}

export interface TaskTriggerMessage extends BaseMessage {
  topic: MessageTopic.TASK_TRIGGER;
  direction: MessageDirection.TO_UI;
  payload: {
    taskId: string;
    params?: Record<string, any>;
  };
}

export type ToUIMessage =
  | UICommandMessage
  | FormPrefillMessage
  | NavigationMessage
  | TaskTriggerMessage;

// ============================================================================
// Union types
// ============================================================================

export type AgentBridgeMessage = ToAgentMessage | ToUIMessage;

// ============================================================================
// Handler Types
// ============================================================================

export type MessageHandler<T extends AgentBridgeMessage = AgentBridgeMessage> = (
  message: T
) => void | Promise<void>;

export interface MessageHandlerRegistry {
  [MessageTopic.UI_COMMAND]: MessageHandler<UICommandMessage>[];
  [MessageTopic.FORM_PREFILL]: MessageHandler<FormPrefillMessage>[];
  [MessageTopic.NAVIGATION]: MessageHandler<NavigationMessage>[];
  [MessageTopic.TASK_TRIGGER]: MessageHandler<TaskTriggerMessage>[];
}

// ============================================================================
// Action Registry Types
// ============================================================================

export interface ActionDefinition {
  id: string;
  name: string;
  description?: string;
  context?: AppContext[]; // Which contexts this action is valid in
  params?: Record<string, any>;
  handler: (params?: any) => void | Promise<void>;
}

export interface ActionRegistry {
  [actionId: string]: ActionDefinition;
}

// ============================================================================
// State Types
// ============================================================================

export interface AppState {
  currentContext: AppContext;
  previousContext: AppContext | null;
  formStates: Record<string, Record<string, any>>;
  navigationHistory: AppContext[];
  agentAwareness: {
    lastSyncedContext: AppContext | null;
    lastSyncedAt: number | null;
  };
}
