import { z } from 'zod';

/**
 * Login form validation schema
 * Validates email and password for user login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
});

/**
 * Registration form validation schema
 * Validates name, email, password, and organization for user registration
 */
export const registrationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  organization: z
    .string()
    .min(1, 'Organization is required')
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name must be less than 200 characters'),
  role: z
    .enum(['user', 'admin', 'superadmin'])
    .optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

/**
 * Camera settings validation schema
 * Validates camera name, RTSP URL, and location
 */
export const cameraSettingsSchema = z.object({
  name: z
    .string()
    .min(1, 'Camera name is required')
    .min(2, 'Camera name must be at least 2 characters')
    .max(100, 'Camera name must be less than 100 characters'),
  rtsp_url: z
    .string()
    .min(1, 'RTSP URL is required')
    .url('Invalid URL format')
    .refine((url) => url.startsWith('rtsp://') || url.startsWith('rtsps://'), {
      message: 'URL must start with rtsp:// or rtsps://'
    }),
  location: z
    .string()
    .min(1, 'Location is required')
    .min(2, 'Location must be at least 2 characters')
    .max(200, 'Location must be less than 200 characters'),
  is_active: z
    .boolean()
    .optional(),
  organization_id: z
    .string()
    .optional()
});

/**
 * Alert filters validation schema
 * Validates date range, alert type, and status for filtering alerts
 */
export const alertFiltersSchema = z.object({
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid start date format'
    }),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid end date format'
    }),
  type: z
    .enum(['all', 'theft', 'fall', 'violence', 'trespassing', 'other'])
    .optional()
    .default('all'),
  status: z
    .enum(['all', 'new', 'acknowledged', 'resolved', 'dismissed'])
    .optional()
    .default('all'),
  camera_id: z
    .string()
    .optional(),
  limit: z
    .number()
    .int()
    .positive()
    .max(100, 'Limit must be at most 100')
    .optional()
    .default(50),
  offset: z
    .number()
    .int()
    .min(0, 'Offset must be at least 0')
    .optional()
    .default(0)
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before end date',
  path: ['startDate']
});

/**
 * User profile update validation schema
 * Validates user profile fields for updates
 */
export const userProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s-()]{10,}$/.test(val), {
      message: 'Invalid phone number format'
    }),
  organization: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name must be less than 200 characters')
    .optional(),
  notification_preferences: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional()
    })
    .optional()
});

/**
 * Password change validation schema
 */
export const passwordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(1, 'New password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmNewPassword: z
    .string()
    .min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ['confirmNewPassword']
});

/**
 * Organization creation/update validation schema
 */
export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  contact_email: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  contact_phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s-()]{10,}$/.test(val), {
      message: 'Invalid phone number format'
    }),
  max_cameras: z
    .number()
    .int()
    .positive()
    .max(1000, 'Maximum cameras must be at most 1000')
    .optional()
    .default(10)
});

/**
 * Detection settings validation schema
 */
export const detectionSettingsSchema = z.object({
  confidence_threshold: z
    .number()
    .min(0, 'Confidence threshold must be at least 0')
    .max(1, 'Confidence threshold must be at most 1'),
  enable_fall_detection: z.boolean().optional(),
  enable_theft_detection: z.boolean().optional(),
  enable_violence_detection: z.boolean().optional(),
  enable_trespassing_detection: z.boolean().optional(),
  alert_cooldown: z
    .number()
    .int()
    .min(0, 'Alert cooldown must be at least 0')
    .max(3600, 'Alert cooldown must be at most 3600 seconds')
});

/**
 * Type exports for form validation functions
 */
export const validationTypes = {
  LOGIN: 'login',
  REGISTRATION: 'registration',
  CAMERA_SETTINGS: 'cameraSettings',
  ALERT_FILTERS: 'alertFilters',
  USER_PROFILE: 'userProfileUpdate',
  PASSWORD_CHANGE: 'passwordChange',
  ORGANIZATION: 'organization',
  DETECTION_SETTINGS: 'detectionSettings'
};

/**
 * Get schema by type
 * @param {string} type - The type of validation schema
 * @returns {z.ZodSchema} The Zod schema
 */
export const getSchemaByType = (type) => {
  const schemas = {
    [validationTypes.LOGIN]: loginSchema,
    [validationTypes.REGISTRATION]: registrationSchema,
    [validationTypes.CAMERA_SETTINGS]: cameraSettingsSchema,
    [validationTypes.ALERT_FILTERS]: alertFiltersSchema,
    [validationTypes.USER_PROFILE]: userProfileUpdateSchema,
    [validationTypes.PASSWORD_CHANGE]: passwordChangeSchema,
    [validationTypes.ORGANIZATION]: organizationSchema,
    [validationTypes.DETECTION_SETTINGS]: detectionSettingsSchema
  };
  
  return schemas[type] || null;
};

/**
 * Validate data against a schema
 * @param {object} data - The data to validate
 * @param {z.ZodSchema} schema - The Zod schema
 * @returns {{success: boolean, errors: object|null, data: object|null}}
 */
export const validateData = (data, schema) => {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      errors: null,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return {
        success: false,
        errors,
        data: null
      };
    }
    return {
      success: false,
      errors: { _form: 'Validation failed' },
      data: null
    };
  }
};

export default {
  loginSchema,
  registrationSchema,
  cameraSettingsSchema,
  alertFiltersSchema,
  userProfileUpdateSchema,
  passwordChangeSchema,
  organizationSchema,
  detectionSettingsSchema,
  validationTypes,
  getSchemaByType,
  validateData
};
