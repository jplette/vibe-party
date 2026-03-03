import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BringItemList } from '../BringItemList';
import { renderWithProviders, makeBringItem, makeEventMember, makeUser } from '../../../test/utils';

// Mock the hooks used by BringItemList
vi.mock('../../../hooks/useItems', () => ({
  useItems: vi.fn(),
  useCreateItem: vi.fn(),
  useToggleItem: vi.fn(),
  useDeleteItem: vi.fn(),
}));

vi.mock('../../../hooks/useInvitations', () => ({
  useEventMembers: vi.fn(),
}));

import { useItems, useCreateItem, useToggleItem, useDeleteItem } from '../../../hooks/useItems';
import { useEventMembers } from '../../../hooks/useInvitations';

const mockMutate = vi.fn();
const mockMutateAsync = vi.fn().mockResolvedValue({});

function setupHooks({
  items = [] as ReturnType<typeof makeBringItem>[],
  isLoading = false,
  isError = false,
  members = [] as ReturnType<typeof makeEventMember>[],
} = {}) {
  vi.mocked(useItems).mockReturnValue({
    data: items,
    isLoading,
    isError,
  } as unknown as ReturnType<typeof useItems>);

  vi.mocked(useEventMembers).mockReturnValue({
    data: members,
  } as unknown as ReturnType<typeof useEventMembers>);

  vi.mocked(useCreateItem).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateItem>);

  vi.mocked(useToggleItem).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useToggleItem>);

  vi.mocked(useDeleteItem).mockReturnValue({
    mutate: mockMutate,
  } as unknown as ReturnType<typeof useDeleteItem>);
}

describe('BringItemList', () => {
  it('shows a loading spinner while items are loading', () => {
    setupHooks({ isLoading: true });
    renderWithProviders(<BringItemList eventId="evt-1" />);
    // PrimeReact ProgressSpinner renders an SVG role="img" or a div
    expect(screen.getByRole('progressbar', { hidden: true }) ?? screen.queryByRole('img')).toBeDefined();
  });

  it('shows an error message when loading fails', () => {
    setupHooks({ isError: true });
    renderWithProviders(<BringItemList eventId="evt-1" />);
    expect(screen.getByText(/failed to load items/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no items', () => {
    setupHooks({ items: [] });
    renderWithProviders(<BringItemList eventId="evt-1" />);
    expect(screen.getByText(/no items yet/i)).toBeInTheDocument();
  });

  it('renders pending items under "Still needed" section', () => {
    setupHooks({ items: [makeBringItem({ name: 'Wine', fulfilledAt: undefined })] });
    renderWithProviders(<BringItemList eventId="evt-1" />);
    expect(screen.getByText(/still needed/i)).toBeInTheDocument();
    expect(screen.getByText('Wine')).toBeInTheDocument();
  });

  it('renders fulfilled items under "Brought" section', () => {
    setupHooks({
      items: [makeBringItem({ name: 'Cups', fulfilledAt: '2026-01-01T10:00:00Z' })],
    });
    renderWithProviders(<BringItemList eventId="evt-1" />);
    expect(screen.getByText(/brought/i)).toBeInTheDocument();
    expect(screen.getByText('Cups')).toBeInTheDocument();
  });

  it('renders item with quantity', () => {
    setupHooks({ items: [makeBringItem({ name: 'Beer', quantity: '12 cans' })] });
    renderWithProviders(<BringItemList eventId="evt-1" />);
    expect(screen.getByText(/12 cans/)).toBeInTheDocument();
  });

  it('shows the Add Item button initially', () => {
    setupHooks({ items: [] });
    renderWithProviders(<BringItemList eventId="evt-1" />);
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
  });

  it('shows the add item form when Add Item is clicked', async () => {
    const user = userEvent.setup();
    setupHooks({ items: [] });
    renderWithProviders(<BringItemList eventId="evt-1" />);

    await user.click(screen.getByRole('button', { name: /add item/i }));
    // BringItemForm renders an "Item name" input
    expect(screen.getByRole('textbox', { name: /item name/i })).toBeInTheDocument();
  });

  it('hides the add form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    setupHooks({ items: [] });
    renderWithProviders(<BringItemList eventId="evt-1" />);

    await user.click(screen.getByRole('button', { name: /add item/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('textbox', { name: /item name/i })).not.toBeInTheDocument();
  });

  it('calls delete mutation when trash button is clicked', async () => {
    const user = userEvent.setup();
    const deleteMutate = vi.fn();
    const item = makeBringItem({ id: 'item-99', name: 'Ice' });
    setupHooks({ items: [item] });
    vi.mocked(useDeleteItem).mockReturnValue({ mutate: deleteMutate } as unknown as ReturnType<typeof useDeleteItem>);

    renderWithProviders(<BringItemList eventId="evt-1" />);
    await user.click(screen.getByRole('button', { name: /delete item: ice/i }));
    expect(deleteMutate).toHaveBeenCalledWith('item-99');
  });

  it('shows assignee tag when item is assigned to a known member', () => {
    const user = makeUser({ id: 'user-dave', name: 'Dave' });
    const member = makeEventMember({ userId: 'user-dave', user });
    const item = makeBringItem({ name: 'Salad', assignedTo: 'user-dave' });
    setupHooks({ items: [item], members: [member] });

    renderWithProviders(<BringItemList eventId="evt-1" />);
    expect(screen.getByText(/Dave/)).toBeInTheDocument();
  });

  it('calls createItem when a new item is submitted via the form', async () => {
    const user = userEvent.setup();
    setupHooks({ items: [] });

    renderWithProviders(<BringItemList eventId="evt-1" />);
    await user.click(screen.getByRole('button', { name: /add item/i }));
    await user.type(screen.getByRole('textbox', { name: /item name/i }), 'Soda');
    await user.click(screen.getByRole('button', { name: /add item/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Soda' })
      );
    });
  });
});
