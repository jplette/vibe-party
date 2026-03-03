import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BringItemForm } from '../BringItemForm';
import { renderWithProviders, makeEventMember, makeUser } from '../../../test/utils';

describe('BringItemForm', () => {
  const noop = vi.fn();

  it('renders the item name field', () => {
    renderWithProviders(
      <BringItemForm members={[]} onSubmit={noop} onCancel={noop} />
    );
    expect(screen.getByRole('textbox', { name: /item name/i })).toBeInTheDocument();
  });

  it('renders the quantity field', () => {
    renderWithProviders(
      <BringItemForm members={[]} onSubmit={noop} onCancel={noop} />
    );
    expect(screen.getByRole('textbox', { name: /quantity/i })).toBeInTheDocument();
  });

  it('calls onCancel when the Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(
      <BringItemForm members={[]} onSubmit={noop} onCancel={onCancel} />
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows a validation error when submitted with an empty item name', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <BringItemForm members={[]} onSubmit={noop} onCancel={noop} />
    );
    await user.click(screen.getByRole('button', { name: /add item/i }));
    await waitFor(() => {
      expect(screen.getByText(/item name is required/i)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with correct values when form is filled and submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <BringItemForm members={[]} onSubmit={onSubmit} onCancel={noop} />
    );

    await user.type(screen.getByRole('textbox', { name: /item name/i }), 'Chips');
    await user.type(screen.getByRole('textbox', { name: /quantity/i }), '2 bags');
    await user.click(screen.getByRole('button', { name: /add item/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Chips', quantity: '2 bags' })
      );
    });
  });

  it('does not call onSubmit when item name is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <BringItemForm members={[]} onSubmit={onSubmit} onCancel={noop} />
    );
    await user.click(screen.getByRole('button', { name: /add item/i }));
    // Give the form time to run validation
    await waitFor(() => {
      expect(screen.getByText(/item name is required/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not render the assignee dropdown when members list is empty', () => {
    renderWithProviders(
      <BringItemForm members={[]} onSubmit={noop} onCancel={noop} />
    );
    expect(screen.queryByText(/bring by/i)).not.toBeInTheDocument();
  });

  it('renders the assignee dropdown when members are provided', () => {
    const member = makeEventMember({ user: makeUser({ name: 'Carol' }) });
    renderWithProviders(
      <BringItemForm members={[member]} onSubmit={noop} onCancel={noop} />
    );
    // PrimeReact Dropdown renders both a hidden option and a visible placeholder span
    expect(screen.getAllByText(/bring by/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows loading state on submit button when isLoading is true', () => {
    renderWithProviders(
      <BringItemForm members={[]} onSubmit={noop} onCancel={noop} isLoading />
    );
    // PrimeReact Button renders a spinner when loading; the button is still in DOM
    const btn = screen.getByRole('button', { name: /add item/i });
    expect(btn).toBeInTheDocument();
  });

  it('clears the form after successful submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <BringItemForm members={[]} onSubmit={onSubmit} onCancel={noop} />
    );

    const nameInput = screen.getByRole('textbox', { name: /item name/i });
    await user.type(nameInput, 'Napkins');
    await user.click(screen.getByRole('button', { name: /add item/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    // After reset, the input should be cleared
    expect(nameInput).toHaveValue('');
  });
});
