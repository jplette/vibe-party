import { Card, Flex, Heading, Text, Badge } from '@radix-ui/themes';
import { CalendarIcon, GlobeIcon, StarFilledIcon } from '@radix-ui/react-icons';
import { isFuture, formatDateTimeRange, formatDate } from '../../utils/formatDate';
import type { EventWithRole } from '../../types';

interface EventCardProps {
  event: EventWithRole;
  onClick: () => void;
  currentUserId?: string | null;
}

export function EventCard({ event, onClick, currentUserId }: EventCardProps) {
  const upcoming = isFuture(event.date, event.endDate);
  const isOwner = currentUserId != null && event.createdBy === currentUserId;

  return (
    <Card
      style={{
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        borderLeft: isOwner ? '3px solid #ff6b35' : undefined,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.transform = '';
      }}
    >
      <Flex justify="between" align="start" mb="2">
        <Heading size="4" style={{ flex: 1, lineHeight: '1.3' }}>
          {event.name}
        </Heading>
        <Flex gap="1" align="center" style={{ flexShrink: 0 }} ml="2">
          <Badge
            color={isOwner ? 'orange' : 'gray'}
            variant="soft"
          >
            {isOwner ? 'Owner' : 'Member'}
          </Badge>
          <Badge
            color={upcoming ? 'green' : 'gray'}
            variant="soft"
          >
            {upcoming ? 'Upcoming' : 'Past'}
          </Badge>
        </Flex>
      </Flex>

      {event.date && (
        <Flex align="center" gap="1" mb="1">
          <CalendarIcon style={{ color: 'var(--gray-9)', width: 13, height: 13, flexShrink: 0 }} />
          <Text size="1" color="gray">
            {formatDateTimeRange(event.date, event.endDate)}
          </Text>
        </Flex>
      )}

      {event.locationName && (
        <Flex align="center" gap="1" mb="2">
          <GlobeIcon style={{ color: 'var(--gray-9)', width: 13, height: 13, flexShrink: 0 }} />
          <Text size="1" color="gray" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.locationName}
          </Text>
        </Flex>
      )}

      {event.description && (
        <Text
          size="2"
          color="gray"
          mb="2"
          style={
            {
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            } as React.CSSProperties
          }
        >
          {event.description}
        </Text>
      )}

      <Flex align="center" justify="between" mt="3">
        <Flex align="center" gap="1">
          <StarFilledIcon style={{ color: isOwner ? '#ff6b35' : 'var(--gray-8)', width: 12, height: 12, flexShrink: 0 }} />
          <Text size="1" color="gray">
            {isOwner ? 'You' : event.ownerName}
          </Text>
        </Flex>
        <Text size="1" color="gray">
          Updated {formatDate(event.updatedAt)}
        </Text>
      </Flex>
    </Card>
  );
}
