import { useState, useCallback, useMemo } from 'react';
import { validateData, getSchemaByType, validationTypes } from '../utils/validations';

/**
 * Custom hook for form validation using Zod
 * @param {string} validationType - The type of validation schema to use
 * @param {object} initialValues - Initial form values
 * @param {boolean} validateOnChange - Whether to validate on every change (default: true)
 * @param {boolean} validateOnBlur - Whether to validate on blur (default: true)
 * @returns {object} Form validation utilities and state
 */
const useFormValidation = (
  validationType,
  initialValues = {},
  validateOnChange = true,
  validateOnBlur = true
) => {
  const schema = useMemo(() => getSchemaByType(validationType), [validationType]);
  
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  /**
   * Validate a single field
   * @param {string} fieldName - The name of the field to validate
   * @param {any} value - The value to validate
   * @returns {string|null} Error message or null if valid
   */
  const validateField = useCallback((fieldName, value) => {
    if (!schema) return null;
    
    try {
      // Create a partial object with only the field being validated
      const partialData = { ...values, [fieldName]: value };
      schema.parse(partialData);
      return null;
    } catch (error) {
      if (error.errors) {
        const fieldError = error.errors.find(
          (err) => err.path.join('.') === fieldName
        );
        return fieldError ? fieldError.message : null;
      }
      return null;
    }
  }, [schema, values]);

  /**
   * Validate all form fields
   * @param {object} formValues - The form values to validate
   * @returns {boolean} Whether the form is valid
   */
  const validateAll = useCallback((formValues = values) => {
    if (!schema) return true;
    
    setIsValidating(true);
    try {
      const result = schema.parse(formValues);
      setErrors({});
      setIsValid(true);
      setIsValidating(false);
      return true;
    } catch (error) {
      if (error.errors) {
        const newErrors = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
        setIsValid(Object.keys(newErrors).length === 0);
      }
      setIsValidating(false);
      return false;
    }
  }, [schema, values]);

  /**
   * Handle input change
   * @param {object} event - The change event
   */
  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const newValue = type === 'checkbox' ? checked : type === 'number' ? Number(value) : value;
    
    setValues((prev) => ({ ...prev, [name]: newValue }));
    
    if (validateOnChange) {
      const fieldError = validateField(name, newValue);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (fieldError) {
          newErrors[name] = fieldError;
        } else {
          delete newErrors[name];
        }
        return newErrors;
      });
      
      // Update overall validity
      if (!fieldError && Object.keys(errors).length === 0) {
        setIsValid(true);
      }
    }
  }, [validateOnChange, validateField, errors]);

  /**
   * Handle input blur
   * @param {object} event - The blur event
   */
  const handleBlur = useCallback((event) => {
    const { name, value } = event.target;
    
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    if (validateOnBlur) {
      const fieldError = validateField(name, value);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (fieldError) {
          newErrors[name] = fieldError;
        } else {
          delete newErrors[name];
        }
        return newErrors;
      });
    }
  }, [validateOnBlur, validateField]);

  /**
   * Handle form submission
   * @param {function} submitFn - The function to call on successful validation
   * @returns {Promise<any>} Result of the submit function or error
   */
  const handleSubmit = useCallback(async (submitFn) => {
    const isFormValid = validateAll(values);
    
    if (isFormValid) {
      try {
        const result = await submitFn(values);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error };
      }
    }
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(values).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    return { success: false, errors };
  }, [validateAll, values, errors]);

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, [initialValues]);

  /**
   * Set a specific field value
   * @param {string} name - Field name
   * @param {any} value - Field value
   */
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Set a specific field error
   * @param {string} name - Field name
   * @param {string|null} error - Error message or null
   */
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  }, []);

  /**
   * Set multiple field values at once
   * @param {object} newValues - Object with field values
   */
  const setValuesMultiple = useCallback((newValues) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  /**
   * Get error for a specific field
   * @param {string} name - Field name
   * @returns {string|null} Error message or null
   */
  const getError = useCallback((name) => {
    return errors[name] || null;
  }, [errors]);

  /**
   * Check if a field has been touched
   * @param {string} name - Field name
   * @returns {boolean} Whether the field has been touched
   */
  const getTouched = useCallback((name) => {
    return touched[name] || false;
  }, [touched]);

  /**
   * Check if field has error and has been touched
   * @param {string} name - Field name
   * @returns {boolean} Whether to show the error
   */
  const showError = useCallback((name) => {
    return touched[name] && errors[name];
  }, [touched, errors]);

  return {
    // State
    values,
    errors,
    touched,
    isValidating,
    isValid,
    schema,
    
    // Actions
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    setValuesMultiple,
    validateAll,
    validateField,
    
    // Helpers
    getError,
    getTouched,
    showError,
    
    // Constants
    validationTypes
  };
};

export default useFormValidation;
