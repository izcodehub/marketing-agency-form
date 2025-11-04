import React, { useState } from 'react';
import './ClientOnboardingForm.css';

interface FormData {
  companyName: string;
  industry: string;
  mission: string;
  targetAudience: string;
  postingFrequency: 'daily' | 'weekly' | 'biweekly';
  email: string;
  phone: string;
}

interface FormErrors {
  [key: string]: string;
}

export const ClientOnboardingForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    industry: '',
    mission: '',
    targetAudience: '',
    postingFrequency: 'daily',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [channelUrl, setChannelUrl] = useState('');

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Real Estate',
    'Education',
    'E-commerce',
    'Food & Beverage',
    'Fitness & Wellness',
    'Consulting',
    'Manufacturing',
    'Other',
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.industry) {
      newErrors.industry = 'Please select an industry';
    }

    if (!formData.mission.trim()) {
      newErrors.mission = 'Mission description is required';
    } else if (formData.mission.length < 50) {
      newErrors.mission = 'Please provide at least 50 characters';
    }

    if (!formData.targetAudience.trim()) {
      newErrors.targetAudience = 'Target audience is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      const data = await response.json();

      setSubmitSuccess(true);
      setChannelUrl(data.channelUrl);

      // Reset form
      setFormData({
        companyName: '',
        industry: '',
        mission: '',
        targetAudience: '',
        postingFrequency: 'daily',
        email: '',
        phone: '',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({
        submit: 'Failed to submit form. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="success-container">
        <div className="success-icon">✓</div>
        <h2>Welcome Aboard!</h2>
        <p>Your YouTube channel has been created successfully.</p>
        <div className="channel-info">
          <h3>Your Trial Channel</h3>
          <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="channel-link">
            View Your Channel →
          </a>
          <p className="trial-info">
            You'll receive your first post within 24 hours. Your 7-day trial starts now!
          </p>
          <p className="next-steps">
            We'll send an email to <strong>{formData.email}</strong> with next steps.
          </p>
        </div>
        <button
          onClick={() => setSubmitSuccess(false)}
          className="btn-secondary"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>Start Your Free Trial</h1>
        <p>Get a fully branded YouTube channel with daily content for 7 days - no credit card required</p>
      </div>

      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="form-group">
          <label htmlFor="companyName">
            Company Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className={errors.companyName ? 'error' : ''}
            placeholder="e.g., Acme Corp"
          />
          {errors.companyName && <span className="error-message">{errors.companyName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="industry">
            Industry <span className="required">*</span>
          </label>
          <select
            id="industry"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className={errors.industry ? 'error' : ''}
          >
            <option value="">Select your industry</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
          {errors.industry && <span className="error-message">{errors.industry}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="mission">
            Company Mission & Description <span className="required">*</span>
          </label>
          <textarea
            id="mission"
            name="mission"
            value={formData.mission}
            onChange={handleChange}
            className={errors.mission ? 'error' : ''}
            placeholder="Describe what your company does, your values, and what makes you unique..."
            rows={4}
          />
          <span className="char-count">{formData.mission.length} / 500</span>
          {errors.mission && <span className="error-message">{errors.mission}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="targetAudience">
            Target Audience <span className="required">*</span>
          </label>
          <textarea
            id="targetAudience"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleChange}
            className={errors.targetAudience ? 'error' : ''}
            placeholder="Who are your ideal customers? (age, location, interests, pain points...)"
            rows={3}
          />
          {errors.targetAudience && <span className="error-message">{errors.targetAudience}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="postingFrequency">
            Preferred Posting Frequency <span className="required">*</span>
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="postingFrequency"
                value="daily"
                checked={formData.postingFrequency === 'daily'}
                onChange={handleChange}
              />
              <span>Daily (Recommended)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="postingFrequency"
                value="weekly"
                checked={formData.postingFrequency === 'weekly'}
                onChange={handleChange}
              />
              <span>3x per Week</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="postingFrequency"
                value="biweekly"
                checked={formData.postingFrequency === 'biweekly'}
                onChange={handleChange}
              />
              <span>Weekly</span>
            </label>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="your@email.com"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>
        </div>

        {errors.submit && (
          <div className="error-message submit-error">{errors.submit}</div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Your Channel...' : 'Start Free Trial'}
        </button>

        <p className="disclaimer">
          By submitting, you agree to our trial terms. Your channel will be active for 7 days.
          No payment required during trial.
        </p>
      </form>
    </div>
  );
};
