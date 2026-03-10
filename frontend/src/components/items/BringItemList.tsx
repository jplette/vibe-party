import {
  Box,
  Flex,
  Text,
  Badge,
  Checkbox,
  IconButton,
  Separator,
  Spinner,
  Callout,
} from '@radix-ui/themes';
import { TrashIcon, ExclamationTriangleIcon, PersonIcon } from '@radix-ui/react-icons';
import { useItems, useToggleItem, useDeleteItem, useAssignItem } from '../../hooks/useItems';
import { useEventMembers, useInvitations } from '../../hooks/useInvitations';
import { BringItemForm } from './BringItemForm';
import { ItemContextMenu } from './ItemContextMenu';
import type { AssigneeOption, BringItem, EventMember, Invitation } from '../../types';

interface BringItemListProps {
  eventId: string;
}

interface ItemRowProps {
  item: BringItem;
  members: EventMember[];
  invitations: Invitation[];
  assigneeOptions: AssigneeOption[];
  onToggle: () => void;
  onDelete: () => void;
  onAssign: (assignedTo: string | null, assignedInvitationId: string | null) => void;
}

function ItemRow({
  item,
  members,
  invitations,
  assigneeOptions,
  onToggle,
  onDelete,
  onAssign,
}: ItemRowProps) {
  const fulfilled = !!item.fulfilledAt;

  const resolvedAssigneeName = item.assignedTo
    ? (members.find((m) => m.userId === item.assignedTo)?.user?.name ?? item.assignedTo)
    : undefined;

  const assignedInviteeEmail = item.assignedInvitationId
    ? (invitations.find((inv) => inv.id === item.assignedInvitationId)?.email ?? undefined)
    : undefined;

  return (
    <ItemContextMenu item={item} assigneeOptions={assigneeOptions} onAssign={onAssign}>
      <Flex align="center" gap="3" py="2" style={{ cursor: 'context-menu' }}>
        <Checkbox
          checked={fulfilled}
          onCheckedChange={onToggle}
          aria-label={fulfilled ? 'Mark needed' : 'Mark brought'}
          onClick={(e) => e.stopPropagation()}
        />
        <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
          <Text
            size="2"
            style={{
              textDecoration: fulfilled ? 'line-through' : 'none',
              color: fulfilled ? 'var(--gray-9)' : undefined,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {item.name}
          </Text>
          {item.quantity && (
            <Badge variant="surface" size="1" style={{ flexShrink: 0 }}>
              {item.quantity}
            </Badge>
          )}
          {resolvedAssigneeName && (
            <Badge variant="outline" size="1" color="orange" style={{ flexShrink: 0 }}>
              <PersonIcon />
              {resolvedAssigneeName}
            </Badge>
          )}
          {!resolvedAssigneeName && assignedInviteeEmail && (
            <Badge variant="outline" size="1" color="amber" style={{ flexShrink: 0 }}>
              <PersonIcon />
              {assignedInviteeEmail}
            </Badge>
          )}
        </Flex>
        <IconButton
          variant="ghost"
          color="red"
          size="1"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label="Delete item"
          style={{ flexShrink: 0 }}
        >
          <TrashIcon />
        </IconButton>
      </Flex>
    </ItemContextMenu>
  );
}

export function BringItemList({ eventId }: BringItemListProps) {
  const { data: items, isLoading, isError, error } = useItems(eventId);
  const { data: members = [] } = useEventMembers(eventId);
  const { data: invitations = [] } = useInvitations(eventId);
  const toggleItem = useToggleItem(eventId);
  const deleteItem = useDeleteItem(eventId);
  const assignItem = useAssignItem(eventId);

  const assigneeOptions: AssigneeOption[] = [
    ...members.map((m): AssigneeOption => ({
      kind: 'member',
      userId: m.userId,
      name: m.user?.name ?? m.userId,
      email: m.user?.email ?? '',
    })),
    ...invitations
      .filter((inv) => inv.status === 'pending' || inv.status === 'accepted')
      .map((inv): AssigneeOption => ({
        kind: 'invitation',
        invitationId: inv.id,
        email: inv.email,
      })),
  ];

  if (isLoading) {
    return (
      <Flex justify="center" py="6">
        <Spinner size="3" />
      </Flex>
    );
  }

  if (isError) {
    return (
      <Callout.Root color="red" variant="soft">
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>
          {error instanceof Error ? error.message : 'Failed to load bring items.'}
        </Callout.Text>
      </Callout.Root>
    );
  }

  const needed = (items ?? []).filter((i) => !i.fulfilledAt);
  const brought = (items ?? []).filter((i) => !!i.fulfilledAt);

  return (
    <Box>
      {/* Add form */}
      <Box mb="4">
        <BringItemForm eventId={eventId} />
      </Box>

      {/* Still needed section */}
      <Text size="1" weight="bold" color="gray" as="p" mb="2">
        STILL NEEDED ({needed.length})
      </Text>

      {needed.length === 0 && brought.length === 0 ? (
        <Text size="2" color="gray" as="p" style={{ textAlign: 'center', padding: '16px 0' }}>
          No items yet. Add one above.
        </Text>
      ) : needed.length === 0 ? (
        <Text size="2" color="gray" as="p" style={{ padding: '4px 0' }}>
          Everything has been brought!
        </Text>
      ) : (
        needed.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            members={members}
            invitations={invitations}
            assigneeOptions={assigneeOptions}
            onToggle={() => toggleItem.mutate({ itemId: item.id, fulfilled: !!item.fulfilledAt })}
            onDelete={() => deleteItem.mutate(item.id)}
            onAssign={(assignedTo, assignedInvitationId) =>
              assignItem.mutate({ itemId: item.id, assignedTo, assignedInvitationId })
            }
          />
        ))
      )}

      <Separator my="3" size="4" />

      {/* Brought section */}
      <Text size="1" weight="bold" color="gray" as="p" mb="2">
        BROUGHT ({brought.length})
      </Text>

      {brought.length === 0 ? (
        <Text size="2" color="gray" as="p" style={{ padding: '4px 0' }}>
          Nothing marked as brought yet.
        </Text>
      ) : (
        brought.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            members={members}
            invitations={invitations}
            assigneeOptions={assigneeOptions}
            onToggle={() => toggleItem.mutate({ itemId: item.id, fulfilled: !!item.fulfilledAt })}
            onDelete={() => deleteItem.mutate(item.id)}
            onAssign={(assignedTo, assignedInvitationId) =>
              assignItem.mutate({ itemId: item.id, assignedTo, assignedInvitationId })
            }
          />
        ))
      )}
    </Box>
  );
}
