import { useState } from "react";

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  email?: boolean;
  match?: string;
}

interface FormField {
  value: string;
  error: string;
  rules: ValidationRules;
}

interface UseAuthFormReturn {
  fields: Record<string, FormField>;
  errors: Record<string, string>;
  setFieldValue: (fieldName: string, value: string) => void;
  validateField: (fieldName: string) => boolean;
  validateForm: () => boolean;
  clearErrors: () => void;
  getFieldValue: (fieldName: string) => string;
}

/**
 * Custom hook for form management used across auth screens
 * Provides consistent form validation, error handling, and state management
 */
export function useAuthForm(
  initialFields: Record<string, ValidationRules>
): UseAuthFormReturn {
  const [fields, setFields] = useState<Record<string, FormField>>(() => {
    const initialFormFields: Record<string, FormField> = {};
    Object.keys(initialFields).forEach((fieldName) => {
      initialFormFields[fieldName] = {
        value: "",
        error: "",
        rules: initialFields[fieldName],
      };
    });
    return initialFormFields;
  });

  const setFieldValue = (fieldName: string, value: string) => {
    setFields((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        error: "", // Clear error when user types
      },
    }));
  };

  const validateField = (fieldName: string): boolean => {
    const field = fields[fieldName];
    if (!field) return true;

    const { value, rules } = field;
    let error = "";

    // Required validation
    if (rules.required && !value.trim()) {
      error = `${
        fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
      } is required`;
    }
    // Email validation
    else if (rules.email && value && !/\S+@\S+\.\S+/.test(value)) {
      error = "Please enter a valid email";
    }
    // Min length validation
    else if (rules.minLength && value && value.length < rules.minLength) {
      error = `${
        fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
      } must be at least ${rules.minLength} characters`;
    }
    // Match validation (for password confirmation)
    else if (rules.match && value && value !== fields[rules.match]?.value) {
      error = `${
        fieldName === "confirmPassword" ? "Passwords" : "Values"
      } do not match`;
    }

    setFields((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error,
      },
    }));

    return !error;
  };

  const validateForm = (): boolean => {
    const fieldNames = Object.keys(fields);
    const validations = fieldNames.map((fieldName) => validateField(fieldName));
    return validations.every((isValid) => isValid);
  };

  const clearErrors = () => {
    setFields((prev) => {
      const updatedFields = { ...prev };
      Object.keys(updatedFields).forEach((fieldName) => {
        updatedFields[fieldName] = {
          ...updatedFields[fieldName],
          error: "",
        };
      });
      return updatedFields;
    });
  };

  const getFieldValue = (fieldName: string): string => {
    return fields[fieldName]?.value || "";
  };

  const errors = Object.keys(fields).reduce((acc, fieldName) => {
    acc[fieldName] = fields[fieldName].error;
    return acc;
  }, {} as Record<string, string>);

  return {
    fields,
    errors,
    setFieldValue,
    validateField,
    validateForm,
    clearErrors,
    getFieldValue,
  };
}
