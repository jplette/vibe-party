import { Card, Flex, Heading, Text, Badge } from '@radix-ui/themes';
import { CalendarIcon, GlobeIcon } from '@radix-ui/react-icons';
import { isFuture, formatDateTimeRange, formatDate } from '../../utils/formatDate';
import type { Event } from '../../types';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const upcoming = isFuture(event.date, event.endDate);

  return (
    <Card
      style={{ cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s' }}
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
        <Badge
          color={upcoming ? 'green' : 'gray'}
          variant="soft"
          ml="2"
          style={{ flexShrink: 0 }}
        >
          {upcoming ? 'Upcoming' : 'Past'}
        </Badge>
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

      <Text size="1" color="gray" mt="3" style={{ display: 'block' }}>
        Created {formatDate(event.createdAt)}
      </Text>
    </Card>
  );
}
