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
import { TrashIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useItems, useToggleItem, useDeleteItem } from '../../hooks/useItems';
import { BringItemForm } from './BringItemForm';
import type { BringItem } from '../../types';

interface BringItemListProps {
  eventId: string;
}

interface ItemRowProps {
  item: BringItem;
  onToggle: () => void;
  onDelete: () => void;
}

function ItemRow({ item, onToggle, onDelete }: ItemRowProps) {
  const fulfilled = !!item.fulfilledAt;
  return (
    <Flex align="center" gap="3" py="2">
      <Checkbox
        checked={fulfilled}
        onCheckedChange={onToggle}
        aria-label={fulfilled ? 'Mark needed' : 'Mark brought'}
      />
      <Text
        size="2"
        style={{
          flex: 1,
          textDecoration: fulfilled ? 'line-through' : 'none',
          color: fulfilled ? 'var(--gray-9)' : undefined,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.name}
      </Text>
      {item.quantity && (
        <Badge variant="surface" size="1" style={{ flexShrink: 0 }}>
          {item.quantity}
        </Badge>
      )}
      <IconButton
        variant="ghost"
        color="red"
        size="1"
        onClick={onDelete}
        aria-label="Delete item"
        style={{ flexShrink: 0 }}
      >
        <TrashIcon />
      </IconButton>
    </Flex>
  );
}

export function BringItemList({ eventId }: BringItemListProps) {
  const { data: items, isLoading, isError, error } = useItems(eventId);
  const toggleItem = useToggleItem(eventId);
  const deleteItem = useDeleteItem(eventId);

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
            onToggle={() => toggleItem.mutate({ itemId: item.id, fulfilled: !!item.fulfilledAt })}
            onDelete={() => deleteItem.mutate(item.id)}
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
            onToggle={() => toggleItem.mutate({ itemId: item.id, fulfilled: !!item.fulfilledAt })}
            onDelete={() => deleteItem.mutate(item.id)}
          />
        ))
      )}
    </Box>
  );
}
