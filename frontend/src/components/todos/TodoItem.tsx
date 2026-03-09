import { Flex, Text, Checkbox, Badge, IconButton } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import type { Todo } from '../../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  currentUserId?: string | null;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const done = !!todo.completedAt;

  return (
    <Flex align="center" gap="3" py="2">
      <Checkbox
        checked={done}
        onCheckedChange={onToggle}
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
      />
      <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
        <Text
          size="2"
          style={{
            textDecoration: done ? 'line-through' : 'none',
            color: done ? 'var(--gray-9)' : undefined,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {todo.title}
        </Text>
        {todo.assignedTo && (
          <Badge variant="outline" size="1" color="orange" style={{ flexShrink: 0 }}>
            {todo.assignedTo}
          </Badge>
        )}
      </Flex>
      <IconButton
        variant="ghost"
        color="red"
        size="1"
        onClick={onDelete}
        aria-label="Delete todo"
        style={{ flexShrink: 0 }}
      >
        <TrashIcon />
      </IconButton>
    </Flex>
  );
}
