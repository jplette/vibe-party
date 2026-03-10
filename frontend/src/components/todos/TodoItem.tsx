import { Flex, Text, Checkbox, Badge, IconButton } from '@radix-ui/themes';
import { TrashIcon, ClockIcon } from '@radix-ui/react-icons';
import type { AssigneeOption, Todo } from '../../types';
import { TodoContextMenu } from './TodoContextMenu';

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  currentUserId?: string | null;
  assigneeOptions: AssigneeOption[];
  resolvedAssigneeName?: string;
  assignedInviteeEmail?: string;
  onAssign: (assignedTo: string | null, assignedInvitationId: string | null) => void;
  onSetDueDate: (dueDate: string | null) => void;
}

export function TodoItem({
  todo,
  onToggle,
  onDelete,
  assigneeOptions,
  resolvedAssigneeName,
  assignedInviteeEmail,
  onAssign,
  onSetDueDate,
}: TodoItemProps) {
  const done = !!todo.completedAt;

  const formattedDueDate = todo.dueDate
    ? new Date(todo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <TodoContextMenu
      todo={todo}
      assigneeOptions={assigneeOptions}
      onAssign={onAssign}
      onSetDueDate={onSetDueDate}
    >
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
          {resolvedAssigneeName && (
            <Badge variant="outline" size="1" color="orange" style={{ flexShrink: 0 }}>
              {resolvedAssigneeName}
            </Badge>
          )}
          {!resolvedAssigneeName && assignedInviteeEmail && (
            <Badge variant="outline" size="1" color="amber" style={{ flexShrink: 0 }}>
              ? {assignedInviteeEmail} (unconfirmed)
            </Badge>
          )}
          {formattedDueDate && (
            <Badge variant="soft" size="1" color="gray" style={{ flexShrink: 0 }}>
              <ClockIcon />
              {formattedDueDate}
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
    </TodoContextMenu>
  );
}
