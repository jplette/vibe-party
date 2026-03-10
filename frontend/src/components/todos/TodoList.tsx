import { useRef, useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  TextField,
  Separator,
  Spinner,
  Callout,
} from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import {
  useTodos,
  useCreateTodo,
  useToggleTodo,
  useDeleteTodo,
  useAssignTodo,
  useSetTodoDueDate,
} from '../../hooks/useTodos';
import { useEventMembers, useInvitations } from '../../hooks/useInvitations';
import { TodoItem } from './TodoItem';
import type { AssigneeOption } from '../../types';

interface TodoListProps {
  eventId: string;
}

export function TodoList({ eventId }: TodoListProps) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: todos, isLoading, isError, error } = useTodos(eventId);
  const { data: members } = useEventMembers(eventId);
  const { data: invitations } = useInvitations(eventId);

  const createTodo = useCreateTodo(eventId);
  const toggleTodo = useToggleTodo(eventId);
  const deleteTodo = useDeleteTodo(eventId);
  const assignTodo = useAssignTodo(eventId);
  const setTodoDueDate = useSetTodoDueDate(eventId);

  const memberMap = new Map(
    (members ?? []).map((m) => [m.userId, m])
  );

  const invitationMap = new Map(
    (invitations ?? []).map((inv) => [inv.id, inv])
  );

  const assigneeOptions: AssigneeOption[] = [
    ...(members ?? []).map((m): AssigneeOption => ({
      kind: 'member',
      userId: m.userId,
      name: m.user?.name ?? m.userId,
      email: m.user?.email ?? '',
    })),
    ...(invitations ?? [])
      .filter((inv) => inv.status === 'pending')
      .map((inv): AssigneeOption => ({
        kind: 'invitation',
        invitationId: inv.id,
        email: inv.email,
      })),
  ];

  const handleAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createTodo.mutate({ title: trimmed }, {
      onSuccess: () => {
        setTitle('');
        inputRef.current?.focus();
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

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
          {error instanceof Error ? error.message : 'Failed to load todos.'}
        </Callout.Text>
      </Callout.Root>
    );
  }

  const pending = (todos ?? []).filter((t) => !t.completedAt);
  const done = (todos ?? []).filter((t) => !!t.completedAt);

  return (
    <Box>
      <Flex gap="2" mb="4">
        <TextField.Root
          ref={inputRef}
          placeholder="Add a todo..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={createTodo.isPending}
          style={{ flex: 1 }}
        />
        <Button
          onClick={handleAdd}
          disabled={createTodo.isPending || !title.trim()}
          loading={createTodo.isPending}
        >
          Add
        </Button>
      </Flex>

      <Text size="1" weight="bold" color="gray" as="p" mb="2">
        PENDING ({pending.length})
      </Text>

      {pending.length === 0 && done.length === 0 ? (
        <Text size="2" color="gray" as="p" style={{ textAlign: 'center', padding: '16px 0' }}>
          No todos yet. Add one above.
        </Text>
      ) : pending.length === 0 ? (
        <Text size="2" color="gray" as="p" style={{ padding: '4px 0' }}>
          All done!
        </Text>
      ) : (
        pending.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={() => toggleTodo.mutate({ todoId: todo.id, completed: !!todo.completedAt })}
            onDelete={() => deleteTodo.mutate(todo.id)}
            assigneeOptions={assigneeOptions}
            resolvedAssigneeName={
              todo.assignedTo
                ? (memberMap.get(todo.assignedTo)?.user?.name ?? todo.assignedTo)
                : undefined
            }
            assignedInviteeEmail={
              todo.assignedInvitationId
                ? (invitationMap.get(todo.assignedInvitationId)?.email ?? undefined)
                : undefined
            }
            onAssign={(assignedTo, assignedInvitationId) =>
              assignTodo.mutate({ todoId: todo.id, assignedTo, assignedInvitationId })
            }
            onSetDueDate={(dueDate) =>
              setTodoDueDate.mutate({ todoId: todo.id, dueDate })
            }
          />
        ))
      )}

      <Separator my="3" size="4" />

      <Text size="1" weight="bold" color="gray" as="p" mb="2">
        DONE ({done.length})
      </Text>

      {done.length === 0 ? (
        <Text size="2" color="gray" as="p" style={{ padding: '4px 0' }}>
          Nothing completed yet.
        </Text>
      ) : (
        done.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={() => toggleTodo.mutate({ todoId: todo.id, completed: !!todo.completedAt })}
            onDelete={() => deleteTodo.mutate(todo.id)}
            assigneeOptions={assigneeOptions}
            resolvedAssigneeName={
              todo.assignedTo
                ? (memberMap.get(todo.assignedTo)?.user?.name ?? todo.assignedTo)
                : undefined
            }
            assignedInviteeEmail={
              todo.assignedInvitationId
                ? (invitationMap.get(todo.assignedInvitationId)?.email ?? undefined)
                : undefined
            }
            onAssign={(assignedTo, assignedInvitationId) =>
              assignTodo.mutate({ todoId: todo.id, assignedTo, assignedInvitationId })
            }
            onSetDueDate={(dueDate) =>
              setTodoDueDate.mutate({ todoId: todo.id, dueDate })
            }
          />
        ))
      )}
    </Box>
  );
}
