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

// useAuthForm hook for the useAuthForm on the home screen
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

  // validateField function for the validateField on the home screen
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

  // validateForm function for the validateForm on the home screen
  const validateForm = (): boolean => {
    const fieldNames = Object.keys(fields);
    const validations = fieldNames.map((fieldName) => validateField(fieldName));
    return validations.every((isValid) => isValid);
  };

  // clearErrors function for the clearErrors on the home screen
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

  // getFieldValue function for the getFieldValue on the home screen
  const getFieldValue = (fieldName: string): string => {
    return fields[fieldName]?.value || "";
  };

  // errors function for the errors on the home screen
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
