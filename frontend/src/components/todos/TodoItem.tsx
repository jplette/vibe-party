
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import type { Todo, EventMember } from '../../types';
import styles from './TodoItem.module.css';

interface TodoItemProps {
  todo: Todo;
  members: EventMember[];
  onToggle: (todoId: string, completed: boolean) => void;
  onDelete: (todoId: string) => void;
  isToggling?: boolean;
}

export function TodoItem({ todo, members, onToggle, onDelete, isToggling }: TodoItemProps) {
  const isCompleted = !!todo.completedAt;

  const assignee = members.find((m) => m.userId === todo.assignedTo);
  const assigneeName = assignee?.user?.name ?? assignee?.user?.email ?? (todo.assignedTo ? 'Unknown' : null);

  return (
    <div className={`${styles.item} ${isCompleted ? styles.completed : ''}`} role="listitem">
      <div className={styles.left}>
        <Checkbox
          inputId={`todo-${todo.id}`}
          checked={isCompleted}
          onChange={() => onToggle(todo.id, isCompleted)}
          disabled={isToggling}
          aria-label={`Mark "${todo.title}" as ${isCompleted ? 'incomplete' : 'complete'}`}
        />
        <div className={styles.content}>
          <label
            htmlFor={`todo-${todo.id}`}
            className={`${styles.title} ${isCompleted ? styles.titleDone : ''}`}
          >
            {todo.title}
          </label>
          {todo.description && (
            <p className={styles.description}>{todo.description}</p>
          )}
          {assigneeName && (
            <Tag
              value={`Assigned: ${assigneeName}`}
              severity="info"
              className={styles.assigneeTag}
            />
          )}
        </div>
      </div>
      <Button
        icon="pi pi-trash"
        text
        severity="danger"
        size="small"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete todo: ${todo.title}`}
        className={styles.deleteBtn}
      />
    </div>
  );
}
