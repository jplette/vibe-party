import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { TodoItem } from './TodoItem';
import { useTodos, useCreateTodo, useToggleTodo, useDeleteTodo } from '../../hooks/useTodos';
import { useEventMembers } from '../../hooks/useInvitations';
import type { TodoFormValues } from '../../types';
import styles from './TodoList.module.css';

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Too long'),
  description: z.string().max(500).optional(),
  assignedTo: z.string().optional(),
});

interface TodoListProps {
  eventId: string;
}

export function TodoList({ eventId }: TodoListProps) {
  const { data: todos, isLoading, isError } = useTodos(eventId);
  const { data: members = [] } = useEventMembers(eventId);
  const createTodo = useCreateTodo(eventId);
  const toggleTodo = useToggleTodo(eventId);
  const deleteTodo = useDeleteTodo(eventId);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    await createTodo.mutateAsync({
      title: data.title,
      description: data.description || undefined,
      assignedTo: data.assignedTo || undefined,
    });
    reset();
    setShowForm(false);
  });

  const memberOptions = members.map((m) => ({
    label: m.user?.name ?? m.user?.email ?? m.userId,
    value: m.userId,
  }));

  if (isLoading) {
    return (
      <div className={styles.center}>
        <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
      </div>
    );
  }

  if (isError) {
    return <Message severity="error" text="Failed to load todos. Please try again." className="w-full" />;
  }

  const pending = (todos ?? []).filter((t) => !t.completedAt);
  const completed = (todos ?? []).filter((t) => !!t.completedAt);

  return (
    <div className={styles.container}>
      {/* Add todo button */}
      {!showForm && (
        <div className={styles.addRow}>
          <Button
            label="Add Todo"
            icon="pi pi-plus"
            outlined
            onClick={() => setShowForm(true)}
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          />
        </div>
      )}

      {/* Add todo form */}
      {showForm && (
        <form onSubmit={onSubmit} className={styles.addForm}>
          <div className={styles.formRow}>
            <InputText
              {...register('title')}
              placeholder="Todo title..."
              className={`${styles.titleInput} ${errors.title ? 'p-invalid' : ''}`}
              autoFocus
              aria-label="Todo title"
            />
            {memberOptions.length > 0 && (
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={memberOptions}
                    placeholder="Assign to..."
                    showClear
                    className={styles.assignDropdown}
                  />
                )}
              />
            )}
          </div>
          {errors.title && (
            <small className={styles.fieldError}>{errors.title.message}</small>
          )}
          <div className={styles.formActions}>
            <Button
              type="submit"
              label="Add"
              icon="pi pi-check"
              size="small"
              loading={createTodo.isPending}
              style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
            />
            <Button
              type="button"
              label="Cancel"
              size="small"
              text
              onClick={() => {
                setShowForm(false);
                reset();
              }}
            />
          </div>
        </form>
      )}

      {/* Empty state */}
      {(todos ?? []).length === 0 && (
        <div className={styles.empty}>
          <i className="pi pi-check-circle" aria-hidden="true" style={{ fontSize: '2.5rem', color: 'var(--color-primary-light)' }} />
          <p>No todos yet. Add one to get started!</p>
        </div>
      )}

      {/* Pending todos */}
      {pending.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            To do <span className={styles.count}>{pending.length}</span>
          </h3>
          <div className={styles.list} role="list">
            {pending.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                members={members}
                onToggle={(id, completed) => toggleTodo.mutate({ todoId: id, completed })}
                onDelete={(id) => deleteTodo.mutate(id)}
                isToggling={toggleTodo.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed todos */}
      {completed.length > 0 && (
        <>
          {pending.length > 0 && <Divider />}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Done <span className={styles.count}>{completed.length}</span>
            </h3>
            <div className={styles.list} role="list">
              {completed.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  members={members}
                  onToggle={(id, isCompleted) => toggleTodo.mutate({ todoId: id, completed: isCompleted })}
                  onDelete={(id) => deleteTodo.mutate(id)}
                  isToggling={toggleTodo.isPending}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
