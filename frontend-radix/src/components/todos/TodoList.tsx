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
import { useTodos, useCreateTodo, useToggleTodo, useDeleteTodo } from '../../hooks/useTodos';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  eventId: string;
}

export function TodoList({ eventId }: TodoListProps) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: todos, isLoading, isError, error } = useTodos(eventId);
  const createTodo = useCreateTodo(eventId);
  const toggleTodo = useToggleTodo(eventId);
  const deleteTodo = useDeleteTodo(eventId);

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
      {/* Add form */}
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

      {/* Pending section */}
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
          />
        ))
      )}

      <Separator my="3" size="4" />

      {/* Done section */}
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
          />
        ))
      )}
    </Box>
  );
}
