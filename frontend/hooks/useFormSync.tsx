// hooks/useFormSync.tsx

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAgentBridge } from "./useAgentBridge";
import { useAppStore, selectFormState } from "@/lib/store/app-store";
import { MessageTopic } from "@/types/agent-bridge";

/**
 * Hook to sync form changes with agent
 * Use this in form components
 */
export function useFormSync(formId: string) {
  const { sendToAgent } = useAgentBridge();
  const currentContext = useAppStore((state) => state.currentContext);
  const updateFormState = useAppStore((state) => state.updateFormState);
  const formState = useAppStore(selectFormState(formId));
  const getFormState = useAppStore((state) => state.getFormState);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  /**
   * Update a field value and notify agent
   */
  const updateField = useCallback(
    (field: string, value: any, immediate = false) => {
      // Update local state immediately
      updateFormState(formId, field, value);

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      const sendUpdate = () => {
        const allValues = getFormState(formId);
        sendToAgent({
          topic: MessageTopic.FORM_UPDATE,
          payload: {
            context: currentContext,
            formId,
            field,
            value,
            allValues: { ...allValues, [field]: value },
          },
        });
      };

      if (immediate) {
        sendUpdate();
      } else {
        // Debounce by 500ms for non-critical updates
        debounceTimerRef.current = setTimeout(sendUpdate, 500);
      }
    },
    [formId, currentContext, updateFormState, getFormState, sendToAgent]
  );

  /**
   * Send a user action related to this form
   */
  const sendAction = useCallback(
    (action: string, data?: Record<string, any>) => {
      sendToAgent({
        topic: MessageTopic.USER_ACTION,
        payload: {
          context: currentContext,
          action,
          data: {
            formId,
            ...data,
          },
        },
      });
    },
    [formId, currentContext, sendToAgent]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    formState,
    updateField,
    sendAction,
  };
}
