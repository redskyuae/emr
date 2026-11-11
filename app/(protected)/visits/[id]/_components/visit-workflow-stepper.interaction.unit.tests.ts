// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

import { visitWorkflowSteps } from '../_utils/visit-workflow';
import { VisitWorkflowStepper } from './visit-workflow-stepper';

const visit = {
  checkedInAt: '2026-11-05T09:00:00.000Z',
  consultationStartedAt: null,
  completedAt: null,
  cancelledAt: null,
} as unknown as Visit;

const steps = visitWorkflowSteps({
  status: 'IN_CONSULTATION',
  vitalsCount: 1,
  noteCount: 1,
  draftNoteCount: 0,
  invoiceCount: 0,
});

afterEach(cleanup);

describe('Visit workflow stepper', () => {
  it('should open a step when it is selected', () => {
    const onStepSelect = vi.fn();
    render(createElement(VisitWorkflowStepper, { visit, steps, onStepSelect }));

    fireEvent.click(screen.getByRole('button', { name: /Invoice/ }));

    expect(onStepSelect).toHaveBeenCalledWith('invoice');
  });

  it('should mark the next step for assistive technology and in text', () => {
    render(createElement(VisitWorkflowStepper, { visit, steps, onStepSelect: vi.fn() }));

    const current = screen.getByRole('button', { name: /Invoice/ });

    expect(current.getAttribute('aria-current')).toBe('step');
    expect(current.textContent).toContain('Next');
  });
});
