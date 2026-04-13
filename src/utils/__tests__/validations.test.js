import {
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
  validateData,
} from '../validations';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate a valid login input', () => {
      const data = { email: 'test@example.com', password: 'password123' };
      expect(() => loginSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const data = { email: 'not-an-email', password: 'password123' };
      expect(() => loginSchema.parse(data)).toThrow();
    });

    it('should reject short password', () => {
      const data = { email: 'test@example.com', password: '123' };
      expect(() => loginSchema.parse(data)).toThrow();
    });

    it('should reject missing email', () => {
      const data = { password: 'password123' };
      expect(() => loginSchema.parse(data)).toThrow();
    });

    it('should reject missing password', () => {
      const data = { email: 'test@example.com' };
      expect(() => loginSchema.parse(data)).toThrow();
    });
  });

  describe('registrationSchema', () => {
    it('should validate a valid registration input', () => {
      const data = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'Password1!',
        confirmPassword: 'Password1!',
        organization: 'Test Org',
      };
      expect(() => registrationSchema.parse(data)).not.toThrow();
    });

    it('should reject password without uppercase', () => {
      const data = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password1!',
        confirmPassword: 'password1!',
        organization: 'Test Org',
      };
      expect(() => registrationSchema.parse(data)).toThrow();
    });

    it('should reject password without lowercase', () => {
      const data = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'PASSWORD1!',
        confirmPassword: 'PASSWORD1!',
        organization: 'Test Org',
      };
      expect(() => registrationSchema.parse(data)).toThrow();
    });

    it('should reject password without number', () => {
      const data = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'Password!',
        confirmPassword: 'Password!',
        organization: 'Test Org',
      };
      expect(() => registrationSchema.parse(data)).toThrow();
    });

    it('should reject password without special character', () => {
      const data = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'Password1',
        confirmPassword: 'Password1',
        organization: 'Test Org',
      };
      expect(() => registrationSchema.parse(data)).toThrow();
    });

    it('should reject mismatched passwords', () => {
      const data = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'Password1!',
        confirmPassword: 'Password2!',
        organization: 'Test Org',
      };
      expect(() => registrationSchema.parse(data)).toThrow();
    });

    it('should reject short name', () => {
      const data = {
        name: 'J',
        email: 'test@example.com',
        password: 'Password1!',
        confirmPassword: 'Password1!',
        organization: 'Test Org',
      };
      expect(() => registrationSchema.parse(data)).toThrow();
    });

    it('should reject short organization name', () => {
      const data = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'Password1!',
        confirmPassword: 'Password1!',
        organization: 'T',
      };
      expect(() => registrationSchema.parse(data)).toThrow();
    });
  });

  describe('cameraSettingsSchema', () => {
    it('should validate valid camera settings', () => {
      const data = {
        name: 'Front Door Camera',
        rtsp_url: 'rtsp://example.com/stream',
        location: 'Building A',
        is_active: true,
      };
      expect(() => cameraSettingsSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid RTSP URL format', () => {
      const data = {
        name: 'Front Door Camera',
        rtsp_url: 'http://example.com/stream',
        location: 'Building A',
      };
      expect(() => cameraSettingsSchema.parse(data)).toThrow();
    });

    it('should reject non-RTSP URL', () => {
      const data = {
        name: 'Front Door Camera',
        rtsp_url: 'https://example.com/stream',
        location: 'Building A',
      };
      expect(() => cameraSettingsSchema.parse(data)).toThrow();
    });

    it('should accept rtsps:// URLs', () => {
      const data = {
        name: 'Front Door Camera',
        rtsp_url: 'rtsps://example.com/stream',
        location: 'Building A',
      };
      expect(() => cameraSettingsSchema.parse(data)).not.toThrow();
    });
  });

  describe('alertFiltersSchema', () => {
    it('should validate valid alert filters', () => {
      const data = {
        type: 'theft',
        status: 'new',
        limit: 50,
        offset: 0,
      };
      expect(() => alertFiltersSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid date format', () => {
      const data = {
        startDate: 'invalid-date',
        endDate: '2024-12-31',
      };
      expect(() => alertFiltersSchema.parse(data)).toThrow();
    });

    it('should reject start date after end date', () => {
      const data = {
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };
      expect(() => alertFiltersSchema.parse(data)).toThrow();
    });

    it('should reject limit over 100', () => {
      const data = { limit: 200 };
      expect(() => alertFiltersSchema.parse(data)).toThrow();
    });

    it('should use default values', () => {
      const data = {};
      const result = alertFiltersSchema.parse(data);
      expect(result.type).toBe('all');
      expect(result.status).toBe('all');
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });
  });

  describe('userProfileUpdateSchema', () => {
    it('should validate valid profile update', () => {
      const data = {
        name: 'John Doe',
        phone: '+1234567890',
      };
      expect(() => userProfileUpdateSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid phone format', () => {
      const data = { phone: '123' };
      expect(() => userProfileUpdateSchema.parse(data)).toThrow();
    });

    it('should accept optional fields', () => {
      const data = {};
      expect(() => userProfileUpdateSchema.parse(data)).not.toThrow();
    });
  });

  describe('passwordChangeSchema', () => {
    it('should validate valid password change', () => {
      const data = {
        currentPassword: 'OldPassword1!',
        newPassword: 'NewPassword1!',
        confirmNewPassword: 'NewPassword1!',
      };
      expect(() => passwordChangeSchema.parse(data)).not.toThrow();
    });

    it('should reject mismatched new passwords', () => {
      const data = {
        currentPassword: 'OldPassword1!',
        newPassword: 'NewPassword1!',
        confirmNewPassword: 'DifferentPassword1!',
      };
      expect(() => passwordChangeSchema.parse(data)).toThrow();
    });
  });

  describe('organizationSchema', () => {
    it('should validate valid organization', () => {
      const data = {
        name: 'Test Organization',
        description: 'A test organization',
        max_cameras: 50,
      };
      expect(() => organizationSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const data = {
        name: 'Test Organization',
        contact_email: 'not-an-email',
      };
      expect(() => organizationSchema.parse(data)).toThrow();
    });

    it('should use default max_cameras', () => {
      const data = { name: 'Test Org' };
      const result = organizationSchema.parse(data);
      expect(result.max_cameras).toBe(10);
    });
  });

  describe('detectionSettingsSchema', () => {
    it('should validate valid detection settings', () => {
      const data = {
        confidence_threshold: 0.7,
        enable_fall_detection: true,
        enable_theft_detection: true,
        alert_cooldown: 60,
      };
      expect(() => detectionSettingsSchema.parse(data)).not.toThrow();
    });

    it('should reject confidence threshold over 1', () => {
      const data = { confidence_threshold: 1.5 };
      expect(() => detectionSettingsSchema.parse(data)).toThrow();
    });

    it('should reject alert cooldown over 3600', () => {
      const data = { alert_cooldown: 5000 };
      expect(() => detectionSettingsSchema.parse(data)).toThrow();
    });
  });
});

describe('getSchemaByType', () => {
  it('should return correct schema for login', () => {
    const schema = getSchemaByType(validationTypes.LOGIN);
    expect(schema).toBe(loginSchema);
  });

  it('should return correct schema for registration', () => {
    const schema = getSchemaByType(validationTypes.REGISTRATION);
    expect(schema).toBe(registrationSchema);
  });

  it('should return null for unknown type', () => {
    const schema = getSchemaByType('unknown_type');
    expect(schema).toBeNull();
  });
});

describe('validateData', () => {
  it('should return success for valid data', () => {
    const data = { email: 'test@example.com', password: 'password123' };
    const result = validateData(data, loginSchema);
    expect(result.success).toBe(true);
    expect(result.errors).toBeNull();
    expect(result.data).toBeDefined();
  });

  it('should return errors for invalid data', () => {
    const data = { email: 'invalid' };
    const result = validateData(data, loginSchema);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.data).toBeNull();
  });

  it('should format error messages correctly', () => {
    const data = { email: 'invalid' };
    const result = validateData(data, loginSchema);
    expect(result.errors.email).toBeDefined();
  });
});