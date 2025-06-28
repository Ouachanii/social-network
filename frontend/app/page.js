import styles from "./styles/page.module.css";
import { LinkButton } from "./components/link_button";


export default function Home() {
  return (
    <main className={styles.main_container}>
      <h1 className={styles.title}>Welcome to the Social Network!</h1>
      <p style={{ marginBottom: 24 }}>Please login if you have an account, or register if you are new.</p>
      <div style={{ display: 'flex', gap: 16 }}>
        <LinkButton Link="/login" TextContent="Login" />
        <LinkButton Link="/register" TextContent="Register" />
      </div>
    </main>
  );
}