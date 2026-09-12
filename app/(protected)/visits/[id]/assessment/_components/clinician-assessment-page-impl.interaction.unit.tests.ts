// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getStaticClinicianVisit } from '../../../_data/static-clinician-visits';
import { ClinicianAssessmentPageImpl } from './clinician-assessment-page-impl';

afterEach(cleanup);

function renderConsultation() {
  render(
    createElement(ClinicianAssessmentPageImpl, {
      visit: getStaticClinicianVisit(15730)!,
    })
  );
}

describe('ClinicianAssessmentPageImpl interactions', () => {
  it('should allow direct, Previous, and Next navigation without opening validation', async () => {
    const user = userEvent.setup();
    renderConsultation();

    await user.click(screen.getByRole('button', { name: /^3\s*Diagnosis & Orders/ }));

    expect(screen.getByRole('heading', { name: 'Diagnosis & Orders' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Vital Signs' })).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('heading', { name: 'Examination' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /^Next: Diagnosis & Orders/ }));
    expect(screen.getByRole('heading', { name: 'Diagnosis & Orders' })).toBeTruthy();
  });

  it('should preserve entered clinical values while moving between steps', async () => {
    const user = userEvent.setup();
    renderConsultation();

    const complaint = screen.getByLabelText('Chief complaint') as HTMLInputElement;
    await user.clear(complaint);
    await user.type(complaint, 'Persistent cough after exercise');

    await user.click(screen.getByRole('button', { name: /^2\s*Examination/ }));
    await user.click(screen.getByRole('button', { name: /^1\s*Intake/ }));

    expect((screen.getByLabelText('Chief complaint') as HTMLInputElement).value).toBe(
      'Persistent cough after exercise'
    );
  });

  it('should focus the destination step only after its content is rendered', async () => {
    const focusedStepLabels: (string | null)[] = [];
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (
      this: HTMLElement
    ) {
      focusedStepLabels.push(this.getAttribute('aria-label'));
    });
    const user = userEvent.setup();
    renderConsultation();

    await user.click(screen.getByRole('button', { name: /^2\s*Examination/ }));

    await waitFor(() => expect(focusedStepLabels).toContain('Examination'));
    focusSpy.mockRestore();
  });

  it('should expose completion only after the clinician reaches the final step', async () => {
    const user = userEvent.setup();
    renderConsultation();

    expect(screen.queryByRole('button', { name: 'Complete Visit' })).toBeNull();
    expect(screen.getByRole('button', { name: /^Next: Examination/ })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /^4\s*Complete Visit/ }));

    expect(screen.getByRole('button', { name: 'Complete Visit' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Next:/ })).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('should show completion errors without blocking navigation', async () => {
    const user = userEvent.setup();
    renderConsultation();

    await user.click(screen.getByRole('button', { name: /^3\s*Diagnosis & Orders/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Primary' }));
    await user.click(screen.getByRole('button', { name: /^4\s*Complete Visit/ }));
    await user.selectOptions(screen.getByLabelText('Discharge Disposition'), '');
    await user.click(screen.getByRole('button', { name: 'Complete Visit' }));

    expect(screen.getByRole('alert').textContent).toContain('Add a primary diagnosis.');
    expect(screen.getByRole('alert').textContent).toContain('Select a Discharge Disposition.');
    expect(screen.queryByRole('alertdialog')).toBeNull();

    await user.click(screen.getByRole('button', { name: /^1\s*Intake/ }));
    expect(screen.getByRole('heading', { name: 'Intake' })).toBeTruthy();
  });

  it('should allow cancelling confirmation and lock the form only after confirmation', async () => {
    const user = userEvent.setup();
    renderConsultation();

    await user.click(screen.getByRole('button', { name: /^4\s*Complete Visit/ }));
    await user.click(screen.getByRole('button', { name: 'Complete Visit' }));

    let dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByRole('heading', { name: 'Complete this Visit?' })).toBeTruthy();

    await user.click(within(dialog).getByRole('button', { name: 'Continue editing' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect((screen.getByLabelText('Discharge Disposition') as HTMLSelectElement).disabled).toBe(
      false
    );

    await user.click(screen.getByRole('button', { name: 'Complete Visit' }));
    dialog = screen.getByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Complete Visit' }));

    expect(screen.getByText('Visit completed')).toBeTruthy();
    expect((screen.getByLabelText('Discharge Disposition') as HTMLSelectElement).disabled).toBe(
      true
    );
    expect((screen.getByRole('button', { name: 'Save draft' }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });
});
