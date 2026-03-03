import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoItem } from '../TodoItem';
import { renderWithProviders, makeTodo, makeEventMember, makeUser } from '../../../test/utils';

describe('TodoItem', () => {
  const noop = vi.fn();

  it('renders the todo title', () => {
    const todo = makeTodo({ title: 'Buy ice cream' });
    renderWithProviders(
      <TodoItem todo={todo} members={[]} onToggle={noop} onDelete={noop} />
    );
    expect(screen.getByText('Buy ice cream')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    const todo = makeTodo({ title: 'Get supplies', description: 'From IKEA' });
    renderWithProviders(
      <TodoItem todo={todo} members={[]} onToggle={noop} onDelete={noop} />
    );
    expect(screen.getByText('From IKEA')).toBeInTheDocument();
  });

  it('does not render description when absent', () => {
    const todo = makeTodo({ title: 'Clean up', description: undefined });
    renderWithProviders(
      <TodoItem todo={todo} members={[]} onToggle={noop} onDelete={noop} />
    );
    // No description paragraph should appear
    const paras = screen.queryAllByRole('paragraph');
    expect(paras.length).toBe(0);
  });

  it('shows checkbox as unchecked for a pending todo', () => {
    const todo = makeTodo({ completedAt: undefined });
    renderWithProviders(
      <TodoItem todo={todo} members={[]} onToggle={noop} onDelete={noop} />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('shows checkbox as checked for a completed todo', () => {
    const todo = makeTodo({ completedAt: '2026-01-01T10:00:00Z' });
    renderWithProviders(
      <TodoItem todo={todo} members={[]} onToggle={noop} onDelete={noop} />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onToggle with the todo id and current completed state when checkbox clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const todo = makeTodo({ id: 'todo-1', completedAt: undefined });
    renderWithProviders(
      <TodoItem todo={todo} members={[]} onToggle={onToggle} onDelete={noop} />
    );
    await user.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('todo-1', false);
  });

  it('calls onToggle with true when a completed todo is toggled', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const todo = makeTodo({ id: 'todo-2', completedAt: '2026-01-01T00:00:00Z' });
    renderWithProviders(
      <TodoItem todo={todo} members={[]} onToggle={onToggle} onDelete={noop} />
    );
    await user.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('todo-2', true);
  });

  it('calls onDelete with the todo id when delete button clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const todo = makeTodo({ id: 'todo-3', title: 'Take out trash' });
    renderWithProviders(
      <TodoItem todo={todo} members={[]} onToggle={noop} onDelete={onDelete} />
    );
    await user.click(screen.getByRole('button', { name: /delete todo: take out trash/i }));
    expect(onDelete).toHaveBeenCalledWith('todo-3');
  });

  it('disables checkbox when isToggling is true', () => {
    const todo = makeTodo({ completedAt: undefined });
    renderWithProviders(
      <TodoItem todo={todo} members={[]} onToggle={noop} onDelete={noop} isToggling />
    );
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('shows assignee tag when todo is assigned to a known member', () => {
    const user = makeUser({ id: 'user-bob', name: 'Bob Jones' });
    const member = makeEventMember({ userId: 'user-bob', user });
    const todo = makeTodo({ assignedTo: 'user-bob' });
    renderWithProviders(
      <TodoItem todo={todo} members={[member]} onToggle={noop} onDelete={noop} />
    );
    expect(screen.getByText(/Bob Jones/)).toBeInTheDocument();
  });

  it('shows "Unknown" assignee tag when assigned userId has no matching member', () => {
    const todo = makeTodo({ assignedTo: 'unknown-user-id' });
    renderWithProviders(
      <TodoItem todo={todo} members={[]} onToggle={noop} onDelete={noop} />
    );
    expect(screen.getByText(/Unknown/)).toBeInTheDocument();
  });

  it('does not show assignee tag when assignedTo is undefined', () => {
    const todo = makeTodo({ assignedTo: undefined });
    renderWithProviders(
      <TodoItem todo={todo} members={[]} onToggle={noop} onDelete={noop} />
    );
    expect(screen.queryByText(/Assigned/)).not.toBeInTheDocument();
  });
});
