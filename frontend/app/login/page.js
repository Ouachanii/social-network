"use client";
import styles from "@/app/styles/auth.module.css";
import { LinkButton } from "../link_button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [formInputs, setFormInputs] = useState({
    login: "",
    password: "",
  });
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify(formInputs),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          // console.log(errorData);
          alert(errorData.error_message);
        } else {
          if (errorData.message) {
            alert(errorData.error_message);
          }
          throw new Error("Login failed");
        }
        return;
      } else {
        const result = await response.json();
        if (result.token) {
          // Decode the token to get the user ID
          let userId = null;
          try {
            const payload = JSON.parse(atob(result.token.split('.')[1]));
            userId = payload.id; // Assuming the payload has an 'id' field
          } catch (e) {
            console.error("Failed to decode token", e);
            throw new Error("Invalid token received");
          }

          if (userId !== null) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('userId', userId);
            localStorage.setItem('isLoggedIn', 'true');
            router.push("/"); // Redirect to home page
          } else {
            throw new Error("Could not extract userId from token");
          }
        } else {
          throw new Error("No token received");
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <main className={styles.authMain}>
      <h1 className={styles.title}>Social Network</h1>
      <div className={styles.main_container}>
        <form className={styles.login} id="login_form" onSubmit={handleSubmit}>
          <div className={styles.header}>
            <h1>Log in to Social Network</h1>
          </div>

          <div className={styles.body}>
            <div className={styles.container}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Email or Username</label>
                <input
                  id="login"
                  type="text"
                  name="login"
                  placeholder="Enter your email or username"
                  required
                  value={formInputs.login}
                  onChange={(e) =>
                    setFormInputs({ ...formInputs, login: e.target.value })
                  }
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  value={formInputs.password}
                  onChange={(e) =>
                    setFormInputs({ ...formInputs, password: e.target.value })
                  }
                />
              </div>
              <div className={styles.submit}>
                <button className={styles.button1} type="submit">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Log in
                </button>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.container}>
              <LinkButton Link="/register" TextContent="Create New Account" />
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
