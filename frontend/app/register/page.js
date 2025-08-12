"use client";
import { useState } from "react";
import styles from "@/app/styles/auth.module.css";
import { useRouter } from "next/navigation";
import { LinkButton } from "../link_button";

export default function Register() {

  const [formInputs, setFormInputs] = useState({
    firstName: "",
    lastName: "",
    nickName: "",
    email: "",
    gender: "",
    birthDate: "",
    password: "",
    avatar: null,
    aboutMe: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarChange = (e) => {
    setFormInputs({ ...formInputs, avatar: e.target.files[0] });
  };

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      Object.entries(formInputs).forEach(([key,value])=> {if (key) formData.append(key,value)})

      const response = await fetch("http://localhost:8080/api/register", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status == 400) {
          alert(result.error_message);
        } else {
          alert(response.status)
          alert(result.error_message);
        }
      } else {
        // Handle success (e.g., redirect to login)
        alert("Registration successful!");
        // Optionally redirect:
        router.push("/login");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.authMain}>
      <h1 className={styles.title}>Social Network</h1>
      <div className={`${styles.main_container} ${styles.register}`}>
        <form
          className={styles.register}
          id="register_form"
          onSubmit={handleSubmit}
        >
          <div className={styles.header}>
            <h1>Create a new account</h1>
            <p>It's quick and easy.</p>
          </div>

          <div className={styles.body}>
            <div className={styles.container}>
              {/* First Row: First Name and Last Name */}
              <div className={styles.nameRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Enter your first name"
                    required
                    value={formInputs.firstName}
                    onChange={(e) =>
                      setFormInputs({ ...formInputs, firstName: e.target.value })
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Enter your last name"
                    required
                    value={formInputs.lastName}
                    onChange={(e) =>
                      setFormInputs({ ...formInputs, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Second Row: Nick Name and Email */}
              <div className={styles.nameRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Nick Name (Optional)</label>
                  <input
                    type="text"
                    name="nickName"
                    placeholder="Enter your nickname"
                    value={formInputs.nickName}
                    onChange={(e) =>
                      setFormInputs({ ...formInputs, nickName: e.target.value })
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    required
                    value={formInputs.email}
                    onChange={(e) =>
                      setFormInputs({ ...formInputs, email: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Third Row: Gender and Birth Date */}
              <div className={styles.nameRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Gender</label>
                  <select
                    name="gender"
                    required
                    value={formInputs.gender}
                    onChange={(e) =>
                      setFormInputs({ ...formInputs, gender: e.target.value })
                    }
                    className={styles.select}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Birth Date</label>
                  <input
                    type="date"
                    name="birthDate"
                    required
                    value={formInputs.birthDate}
                    onChange={(e) =>
                      setFormInputs({ ...formInputs, birthDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Fourth Row: Password and Avatar */}
              <div className={styles.nameRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Password</label>
                  <input
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
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Avatar (Optional)</label>
                  <input
                    id="file"
                    type="file"
                    name="avatar"
                    className={styles.fileInput}
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              {/* Full Width: About Me */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>About Me (Optional)</label>
                <textarea
                  name="aboutMe"
                  placeholder="Tell us about yourself..."
                  value={formInputs.aboutMe}
                  onChange={(e) =>
                    setFormInputs({ ...formInputs, aboutMe: e.target.value })
                  }
                  rows="3"
                />
              </div>

              {/* Submit Button */}
              <div className={styles.submit}>
                <button
                  className={styles.button1}
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  )}
                  {isLoading ? "Registering..." : "Register"}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.container}>
              <LinkButton Link="/login" TextContent="Already have an account?" />
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
