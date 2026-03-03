import { useState } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { BringItemForm } from './BringItemForm';
import { useItems, useCreateItem, useToggleItem, useDeleteItem } from '../../hooks/useItems';
import { useEventMembers } from '../../hooks/useInvitations';
import type { BringItemFormValues } from '../../types';
import styles from './BringItemList.module.css';

interface BringItemListProps {
  eventId: string;
}

export function BringItemList({ eventId }: BringItemListProps) {
  const { data: items, isLoading, isError } = useItems(eventId);
  const { data: members = [] } = useEventMembers(eventId);
  const createItem = useCreateItem(eventId);
  const toggleItem = useToggleItem(eventId);
  const deleteItem = useDeleteItem(eventId);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data: BringItemFormValues) => {
    await createItem.mutateAsync(data);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className={styles.center}>
        <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
      </div>
    );
  }

  if (isError) {
    return <Message severity="error" text="Failed to load items. Please try again." className="w-full" />;
  }

  const pending = (items ?? []).filter((i) => !i.fulfilledAt);
  const fulfilled = (items ?? []).filter((i) => !!i.fulfilledAt);

  return (
    <div className={styles.container}>
      {!showForm && (
        <div className={styles.addRow}>
          <Button
            label="Add Item"
            icon="pi pi-plus"
            outlined
            onClick={() => setShowForm(true)}
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          />
        </div>
      )}

      {showForm && (
        <BringItemForm
          members={members}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isLoading={createItem.isPending}
        />
      )}

      {(items ?? []).length === 0 && (
        <div className={styles.empty}>
          <i className="pi pi-shopping-bag" aria-hidden="true" style={{ fontSize: '2.5rem', color: 'var(--color-primary-light)' }} />
          <p>No items yet. Add what people should bring!</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Still needed <span className={styles.count}>{pending.length}</span>
          </h3>
          <div className={styles.list} role="list">
            {pending.map((item) => {
              const assignee = members.find((m) => m.userId === item.assignedTo);
              const assigneeName = assignee?.user?.name ?? assignee?.user?.email ?? null;
              return (
                <div key={item.id} className={styles.item} role="listitem">
                  <div className={styles.itemLeft}>
                    <Checkbox
                      inputId={`item-${item.id}`}
                      checked={false}
                      onChange={() => toggleItem.mutate({ itemId: item.id, fulfilled: false })}
                      disabled={toggleItem.isPending}
                      aria-label={`Mark "${item.name}" as brought`}
                    />
                    <div className={styles.itemContent}>
                      <label htmlFor={`item-${item.id}`} className={styles.itemName}>
                        {item.name}
                        {item.quantity && (
                          <span className={styles.quantity}> · {item.quantity}</span>
                        )}
                      </label>
                      {assigneeName && (
                        <Tag
                          value={`Bring: ${assigneeName}`}
                          severity="info"
                          className={styles.assignTag}
                        />
                      )}
                    </div>
                  </div>
                  <Button
                    icon="pi pi-trash"
                    text
                    severity="danger"
                    size="small"
                    onClick={() => deleteItem.mutate(item.id)}
                    aria-label={`Delete item: ${item.name}`}
                    className={styles.deleteBtn}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {fulfilled.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Brought <span className={styles.count}>{fulfilled.length}</span>
          </h3>
          <div className={styles.list} role="list">
            {fulfilled.map((item) => {
              const assignee = members.find((m) => m.userId === item.assignedTo);
              const assigneeName = assignee?.user?.name ?? assignee?.user?.email ?? null;
              return (
                <div key={item.id} className={`${styles.item} ${styles.itemFulfilled}`} role="listitem">
                  <div className={styles.itemLeft}>
                    <Checkbox
                      inputId={`item-fulfilled-${item.id}`}
                      checked={true}
                      onChange={() => toggleItem.mutate({ itemId: item.id, fulfilled: true })}
                      disabled={toggleItem.isPending}
                      aria-label={`Unmark "${item.name}" as brought`}
                    />
                    <div className={styles.itemContent}>
                      <label
                        htmlFor={`item-fulfilled-${item.id}`}
                        className={`${styles.itemName} ${styles.itemNameDone}`}
                      >
                        {item.name}
                        {item.quantity && (
                          <span className={styles.quantity}> · {item.quantity}</span>
                        )}
                      </label>
                      {assigneeName && (
                        <Tag
                          value={`Brought by: ${assigneeName}`}
                          severity="success"
                          className={styles.assignTag}
                        />
                      )}
                    </div>
                  </div>
                  <Button
                    icon="pi pi-trash"
                    text
                    severity="danger"
                    size="small"
                    onClick={() => deleteItem.mutate(item.id)}
                    aria-label={`Delete item: ${item.name}`}
                    className={styles.deleteBtn}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
