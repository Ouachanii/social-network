"use client";
import styles from "@/app/styles/auth.module.css";
import { LinkButton } from "../link_button";
import { useState } from "react";
import { ErrorFormMessage } from "../posts/error_form";
import { useRouter } from "next/navigation";

export default function Login() {
  const [formInputs, setFormInputs] = useState({
    login: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    setErrorMessage("");

    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        body: JSON.stringify(formInputs),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          console.log(errorData);
          setErrorMessage(errorData.error_message);
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
          localStorage.setItem('token', result.token);
          localStorage.setItem('isLoggedIn', 'true');
          router.push("/");
        } else {
          throw new Error("No token received");
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <main>
      <h1 className={styles.title}>Welcome to our Social Network App!</h1>
      <div className={styles.main_container}>
        <form className={styles.login} id="login_form" onSubmit={handleSubmit}>
          <div className={styles.header}>
            <h1>Login</h1>
            <h3>Please enter your information</h3>
          </div>

          <div className={styles.body}>
            <div className={styles.container}>
              <div className={styles.login}>
                <input
                  id="login"
                  type="text"
                  name="login"
                  placeholder="user-name/email."
                  required
                  value={formInputs.login}
                  onChange={(e) =>
                    setFormInputs({ ...formInputs, login: e.target.value })
                  }
                />
              </div>
              <div className={styles.password}>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="password."
                  required
                  value={formInputs.password}
                  onChange={(e) =>
                    setFormInputs({ ...formInputs, password: e.target.value })
                  }
                />
              </div>
              <div className={styles.submit}>
                <button className={styles.button1} type="submit">
                  Login
                </button>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.container}>
              <LinkButton Link="/register" TextContent="Create New Account" />
              <ErrorFormMessage Message={errorMessage} />
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
