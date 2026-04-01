import { describe, it, expect } from 'vitest';
import { loginSchema } from '../schemas/auth.schema';
import { createClientSchema, updateClientSchema } from '../schemas/clients.schema';
import { createReportSchema } from '../schemas/reports.schema';
import { createStrategySchema } from '../schemas/strategy.schema';
import { generateBriefingSchema } from '../schemas/briefings.schema';
import { createUserSchema } from '../schemas/users.schema';

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com' });
    expect(result.success).toBe(false);
  });
});

// ── Clients ───────────────────────────────────────────────────────────────────

describe('createClientSchema', () => {
  it('accepts minimal valid client', () => {
    const result = createClientSchema.safeParse({ name: 'Acme Corp' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.services_scope).toEqual([]);
      expect(result.data.designer_scope).toEqual([]);
    }
  });

  it('trims whitespace from name', () => {
    const result = createClientSchema.safeParse({ name: '  Acme  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Acme');
  });

  it('rejects empty name', () => {
    const result = createClientSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid services_scope value', () => {
    const result = createClientSchema.safeParse({
      name: 'Corp',
      services_scope: ['invalid_scope'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid full payload', () => {
    const result = createClientSchema.safeParse({
      name: 'Acme Corp',
      segment: 'Retail',
      services_scope: ['social_media', 'trafego'],
      designer_scope: ['campanha', 'landing_page'],
      contact_email: 'contact@acme.com',
      start_date: '2024-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects malformed start_date', () => {
    const result = createClientSchema.safeParse({ name: 'Corp', start_date: '15/01/2024' });
    expect(result.success).toBe(false);
  });
});

describe('updateClientSchema', () => {
  it('allows partial update with just status', () => {
    const result = updateClientSchema.safeParse({ status: 'inactive' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateClientSchema.safeParse({ status: 'unknown' });
    expect(result.success).toBe(false);
  });
});

// ── Strategy ──────────────────────────────────────────────────────────────────

describe('createStrategySchema', () => {
  const valid = {
    objectives: 'Grow brand awareness',
    positioning: 'Premium, accessible',
    differentials: 'Quality + price',
    tone: 'Friendly and professional',
  };

  it('accepts valid strategy', () => {
    expect(createStrategySchema.safeParse(valid).success).toBe(true);
  });

  it('defaults products and expected_results to empty string', () => {
    const result = createStrategySchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.products).toBe('');
      expect(result.data.expected_results).toBe('');
    }
  });

  it('rejects missing objectives', () => {
    const { objectives: _o, ...rest } = valid;
    expect(createStrategySchema.safeParse(rest).success).toBe(false);
  });
});

// ── Reports ───────────────────────────────────────────────────────────────────

describe('createReportSchema', () => {
  const valid = {
    campaign_name: 'Q1 Awareness',
    period_start: '2024-01-01',
    period_end: '2024-03-31',
    spend: 5000,
    roas: 3.2,
  };

  it('accepts valid report', () => {
    expect(createReportSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects period_end before period_start', () => {
    const result = createReportSchema.safeParse({
      ...valid,
      period_start: '2024-06-01',
      period_end: '2024-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative spend', () => {
    const result = createReportSchema.safeParse({ ...valid, spend: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = createReportSchema.safeParse({ ...valid, period_start: '01-01-2024' });
    expect(result.success).toBe(false);
  });
});

// ── Briefings ─────────────────────────────────────────────────────────────────

describe('generateBriefingSchema', () => {
  it('accepts valid type=designer', () => {
    expect(generateBriefingSchema.safeParse({ type: 'designer' }).success).toBe(true);
  });

  it('accepts designer + designerScope', () => {
    const r = generateBriefingSchema.safeParse({ type: 'designer', designerScope: 'campanha' });
    expect(r.success).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(generateBriefingSchema.safeParse({ type: 'unknown' }).success).toBe(false);
  });

  it('rejects invalid designerScope', () => {
    expect(generateBriefingSchema.safeParse({ type: 'designer', designerScope: 'xyz' }).success).toBe(false);
  });
});

// ── Users ─────────────────────────────────────────────────────────────────────

describe('createUserSchema', () => {
  const valid = {
    name: 'Jane Doe',
    email: 'jane@agency.com',
    password: 'securepass1',
    role: 'account',
  };

  it('accepts valid user', () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects password shorter than 8 chars', () => {
    expect(createUserSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
  });

  it('rejects invalid role', () => {
    expect(createUserSchema.safeParse({ ...valid, role: 'superuser' }).success).toBe(false);
  });

  it('trims name whitespace', () => {
    const result = createUserSchema.safeParse({ ...valid, name: '  Jane  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Jane');
  });
});
