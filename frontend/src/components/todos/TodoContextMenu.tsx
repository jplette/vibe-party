import { useRef } from 'react';
import { ContextMenu, Text } from '@radix-ui/themes';
import type { AssigneeOption, Todo } from '../../types';

interface TodoContextMenuProps {
  todo: Todo;
  assigneeOptions: AssigneeOption[];
  onAssign: (assignedTo: string | null, assignedInvitationId: string | null) => void;
  onSetDueDate: (dueDate: string | null) => void;
  children: React.ReactNode;
}

export function TodoContextMenu({
  todo,
  assigneeOptions,
  onAssign,
  onSetDueDate,
  children,
}: TodoContextMenuProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const hasAssignee = !!todo.assignedTo || !!todo.assignedInvitationId;
  const hasDueDate = !!todo.dueDate;

  const currentDateValue = todo.dueDate
    ? todo.dueDate.slice(0, 10)
    : '';

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>Assign to...</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            {assigneeOptions.length === 0 && (
              <ContextMenu.Item disabled>No members yet</ContextMenu.Item>
            )}
            {assigneeOptions.map((opt) => {
              if (opt.kind === 'member') {
                return (
                  <ContextMenu.Item
                    key={opt.userId}
                    onSelect={() => onAssign(opt.userId, null)}
                  >
                    {opt.name}
                  </ContextMenu.Item>
                );
              }
              return (
                <ContextMenu.Item
                  key={opt.invitationId}
                  onSelect={() => onAssign(null, opt.invitationId)}
                >
                  <Text as="span">{opt.email}</Text>
                  {' '}
                  <Text as="span" size="1" style={{ color: 'var(--amber-11)' }}>
                    {opt.status === 'accepted' ? '(no account)' : '(pending)'}
                  </Text>
                </ContextMenu.Item>
              );
            })}
          </ContextMenu.SubContent>
        </ContextMenu.Sub>

        <ContextMenu.Item
          onSelect={(e) => {
            e.preventDefault();
            dateInputRef.current?.showPicker?.();
            dateInputRef.current?.focus();
          }}
        >
          <Text as="span">Set due date</Text>
          <input
            ref={dateInputRef}
            type="date"
            defaultValue={currentDateValue}
            style={{
              marginLeft: 8,
              border: 'none',
              background: 'transparent',
              fontSize: 'inherit',
              color: 'inherit',
              cursor: 'pointer',
            }}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              if (e.target.value) {
                onSetDueDate(new Date(e.target.value).toISOString());
              }
            }}
          />
        </ContextMenu.Item>

        {hasAssignee && (
          <ContextMenu.Item color="red" onSelect={() => onAssign(null, null)}>
            Remove assignment
          </ContextMenu.Item>
        )}

        {hasDueDate && (
          <ContextMenu.Item color="red" onSelect={() => onSetDueDate(null)}>
            Clear due date
          </ContextMenu.Item>
        )}
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
