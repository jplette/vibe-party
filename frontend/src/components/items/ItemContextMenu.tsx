import { DropdownMenu, Text } from '@radix-ui/themes';
import type { AssigneeOption, BringItem } from '../../types';

interface ItemContextMenuProps {
  item: BringItem;
  assigneeOptions: AssigneeOption[];
  onAssign: (assignedTo: string | null, assignedInvitationId: string | null) => void;
  children: React.ReactNode;
}

export function ItemContextMenu({
  item,
  assigneeOptions,
  onAssign,
  children,
}: ItemContextMenuProps) {
  const hasAssignee = !!item.assignedTo || !!item.assignedInvitationId;

  const members = assigneeOptions.filter((opt) => opt.kind === 'member');
  const invitations = assigneeOptions.filter((opt) => opt.kind === 'invitation');

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Assign to...</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            {assigneeOptions.length === 0 && (
              <DropdownMenu.Item disabled>No members yet</DropdownMenu.Item>
            )}
            {members.map((opt) => {
              if (opt.kind !== 'member') return null;
              return (
                <DropdownMenu.Item
                  key={opt.userId}
                  onSelect={() => onAssign(opt.userId, null)}
                >
                  {opt.name}
                </DropdownMenu.Item>
              );
            })}
            {invitations.length > 0 && members.length > 0 && (
              <DropdownMenu.Separator />
            )}
            {invitations.map((opt) => {
              if (opt.kind !== 'invitation') return null;
              return (
                <DropdownMenu.Item
                  key={opt.invitationId}
                  onSelect={() => onAssign(null, opt.invitationId)}
                >
                  <Text as="span">{opt.email}</Text>
                </DropdownMenu.Item>
              );
            })}
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>

        {hasAssignee && (
          <>
            <DropdownMenu.Separator />
            <DropdownMenu.Item color="red" onSelect={() => onAssign(null, null)}>
              Remove assignment
            </DropdownMenu.Item>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
