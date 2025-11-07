import type { Request, Response, NextFunction } from "express";
import { TaskStatus } from "../models/task.types.js";

/**
 * Validation rule types
 */
interface StringValidationRule {
  type: "string";
  maxLength?: number;
  minLength?: number;
  required: boolean;
  pattern?: RegExp;
}

interface EnumValidationRule {
  type: "enum";
  values: string[];
  required: boolean;
}

interface CuidValidationRule {
  type: "cuid";
  required: boolean;
}

type ValidationRule =
  | StringValidationRule
  | EnumValidationRule
  | CuidValidationRule;

/**
 * Validation rules configuration
 */
export interface ValidationRules {
  [key: string]: ValidationRule;
}

/**
 * Validation error details
 */
interface ValidationError {
  field: string;
  message: string;
}

/**
 * CUID format pattern (25 characters, lowercase alphanumeric)
 */
const CUID_PATTERN = /^[a-z0-9]{25}$/;

/**
 * Predefined validation rules for common use cases
 */
export const VALIDATION_RULE_SETS = {
  createTask: {
    title: {
      type: "string" as const,
      maxLength: 200,
      minLength: 1,
      required: true,
    },
    description: {
      type: "string" as const,
      maxLength: 1000,
      required: false,
    },
  },
  updateTask: {
    title: {
      type: "string" as const,
      maxLength: 200,
      minLength: 1,
      required: false,
    },
    description: {
      type: "string" as const,
      maxLength: 1000,
      required: false,
    },
  },
  updateTaskStatus: {
    status: {
      type: "enum" as const,
      values: Object.values(TaskStatus),
      required: true,
    },
  },
  taskId: {
    id: {
      type: "cuid" as const,
      required: true,
    },
  },
};

/**
 * Validates a string value against string validation rules
 */
function validateString(
  value: any,
  rule: StringValidationRule,
  fieldName: string
): ValidationError | null {
  // Check if value is required
  if (
    rule.required &&
    (value === undefined || value === null || value === "")
  ) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
    };
  }

  // If not required and value is empty, skip validation
  if (
    !rule.required &&
    (value === undefined || value === null || value === "")
  ) {
    return null;
  }

  // Check if value is a string
  if (typeof value !== "string") {
    return {
      field: fieldName,
      message: `${fieldName} must be a string`,
    };
  }

  // Check minimum length
  if (rule.minLength !== undefined && value.length < rule.minLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${rule.minLength} character(s)`,
    };
  }

  // Check maximum length
  if (rule.maxLength !== undefined && value.length > rule.maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} exceeds maximum length of ${rule.maxLength} characters`,
    };
  }

  // Check pattern if provided
  if (rule.pattern && !rule.pattern.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName} contains invalid characters`,
    };
  }

  return null;
}

/**
 * Validates an enum value against enum validation rules
 */
function validateEnum(
  value: any,
  rule: EnumValidationRule,
  fieldName: string
): ValidationError | null {
  // Check if value is required
  if (
    rule.required &&
    (value === undefined || value === null || value === "")
  ) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
    };
  }

  // If not required and value is empty, skip validation
  if (
    !rule.required &&
    (value === undefined || value === null || value === "")
  ) {
    return null;
  }

  // Check if value is in allowed enum values
  if (!rule.values.includes(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${rule.values.join(", ")}`,
    };
  }

  return null;
}

/**
 * Validates a CUID value
 */
function validateCuid(
  value: any,
  rule: CuidValidationRule,
  fieldName: string
): ValidationError | null {
  // Check if value is required
  if (
    rule.required &&
    (value === undefined || value === null || value === "")
  ) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
    };
  }

  // If not required and value is empty, skip validation
  if (
    !rule.required &&
    (value === undefined || value === null || value === "")
  ) {
    return null;
  }

  // Check if value is a string
  if (typeof value !== "string") {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid CUID`,
    };
  }

  // Check CUID format
  if (!CUID_PATTERN.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must match the CUID format`,
    };
  }

  return null;
}

/**
 * Validates a single field against its validation rule
 */
function validateField(
  value: any,
  rule: ValidationRule,
  fieldName: string
): ValidationError | null {
  switch (rule.type) {
    case "string":
      return validateString(value, rule, fieldName);
    case "enum":
      return validateEnum(value, rule, fieldName);
    case "cuid":
      return validateCuid(value, rule, fieldName);
    default:
      return {
        field: fieldName,
        message: `Unknown validation type for ${fieldName}`,
      };
  }
}

/**
 * Middleware factory that creates validation middleware based on provided rules
 * Validates request body and/or params against defined rules
 * Returns 400 error with descriptive messages if validation fails
 *
 * @param rules - Validation rules to apply
 * @param source - Where to validate from ('body' or 'params')
 * @returns Express middleware function
 */
export function validateInput(
  rules: ValidationRules,
  source: "body" | "params" = "body"
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: ValidationError[] = [];
    const dataSource = source === "body" ? req.body : req.params;

    // Validate each field according to its rules
    for (const [fieldName, rule] of Object.entries(rules)) {
      const value = dataSource[fieldName];
      const error = validateField(value, rule, fieldName);

      if (error) {
        errors.push(error);
      }
    }

    // If there are validation errors, return 400 response
    if (errors.length > 0) {
      const errorMessage =
        errors.length === 1
          ? errors[0]?.message || "Validation failed"
          : `Multiple validation errors: ${errors
              .map((e) => e.message)
              .join("; ")}`;

      res.status(400).json({
        error: "Validation Error",
        message: errorMessage,
        statusCode: 400,
        timestamp: new Date().toISOString(),
        details: errors,
      });
      return;
    }

    // Validation passed, proceed to next middleware
    next();
  };
}
