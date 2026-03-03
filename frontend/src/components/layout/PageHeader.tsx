
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  backTo,
  backLabel = 'Back',
  actions,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        {backTo && (
          <Button
            link
            icon="pi pi-arrow-left"
            label={backLabel}
            className={styles.backBtn}
            onClick={() => navigate(backTo)}
          />
        )}
        <div className={styles.titles}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
