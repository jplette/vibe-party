import { Badge } from '@radix-ui/themes';
import type { Invitation } from '../../types';

interface StatusBadgeProps {
  status: Invitation['status'];
}

const colorMap = {
  pending: 'orange',
  accepted: 'green',
  declined: 'red',
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge color={colorMap[status]} variant="soft">
      {status}
    </Badge>
  );
}
