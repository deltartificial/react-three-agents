import type { AgentMessage } from "../core/AgentConnection";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class MessageValidator {
  /**
   * Validates an AgentMessage for schema correctness
   * @param message The message to validate
   * @returns Validation result with errors if any
   */
  validate(message: any): ValidationResult {
    const errors: string[] = [];

    if (!message || typeof message !== "object") {
      return {
        valid: false,
        errors: ["Message must be an object"],
      };
    }

    if (!("type" in message)) {
      errors.push("Message missing 'type' field");
    }

    if (!("agentId" in message)) {
      errors.push("Message missing 'agentId' field");
    }

    if (!("data" in message)) {
      errors.push("Message missing 'data' field");
    }

    if (
      message.type &&
      !["state", "action", "reset", "info", "error"].includes(message.type)
    ) {
      errors.push(
        `Invalid message type: ${
          message.type
        }. Must be one of: state, action, reset, info, error`
      );
    }

    if (message.agentId && typeof message.agentId !== "string") {
      errors.push("Agent ID must be a string");
    }

    if (message.data && typeof message.data !== "object") {
      errors.push("Data must be an object");
    }

    if (message.type === "state" && message.data) {
      if (message.data.position && !this.isValidPosition(message.data.position)) {
        errors.push("Position must be an array of 3 numbers");
      }

      if (message.data.rotation && !this.isValidRotation(message.data.rotation)) {
        errors.push("Rotation must be an array of 3 numbers");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks if a value is a valid position array [x, y, z]
   */
  private isValidPosition(position: any): boolean {
    return (
      Array.isArray(position) &&
      position.length === 3 &&
      position.every((val) => typeof val === "number")
    );
  }

  /**
   * Checks if a value is a valid rotation array [x, y, z]
   */
  private isValidRotation(rotation: any): boolean {
    return (
      Array.isArray(rotation) &&
      rotation.length === 3 &&
      rotation.every((val) => typeof val === "number")
    );
  }
} 