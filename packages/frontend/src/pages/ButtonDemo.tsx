import { Button } from '../components/Button';
import styles from './ButtonDemo.module.css';

export function ButtonDemo() {
  return (
    <div className={styles.container}>
      <div className={styles.buttonGroup}>
        <Button variant="outline">Slay Today</Button>
        <Button variant="primary">Slay Moloch.</Button>
      </div>
    </div>
  );
}
