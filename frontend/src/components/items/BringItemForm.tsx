import { useState } from 'react';
import { Box, Flex, Text, Button, TextField, Spinner } from '@radix-ui/themes';
import { useCreateItem } from '../../hooks/useItems';
import type { BringItemFormValues } from '../../types';

interface BringItemFormProps {
  eventId: string;
  onSuccess?: () => void;
}

export function BringItemForm({ eventId, onSuccess }: BringItemFormProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');

  const createItem = useCreateItem(eventId);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const values: BringItemFormValues = {
      name: trimmedName,
      quantity: quantity.trim() || undefined,
    };

    createItem.mutate(values, {
      onSuccess: () => {
        setName('');
        setQuantity('');
        onSuccess?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex gap="2" align="end">
        <Box style={{ flex: 2 }}>
          <Text size="1" mb="1" as="label" htmlFor="bring-item-name" color="gray" weight="medium">
            Item name
          </Text>
          <TextField.Root
            id="bring-item-name"
            placeholder="e.g. Chips"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={createItem.isPending}
            required
          />
        </Box>
        <Box style={{ flex: 1 }}>
          <Text size="1" mb="1" as="label" htmlFor="bring-item-qty" color="gray" weight="medium">
            Quantity
          </Text>
          <TextField.Root
            id="bring-item-qty"
            placeholder="e.g. 2 bags"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={createItem.isPending}
          />
        </Box>
        <Button type="submit" disabled={createItem.isPending || !name.trim()}>
          {createItem.isPending ? <Spinner size="1" /> : null}
          Add
        </Button>
      </Flex>
    </form>
  );
}
