"use client";
import { useState } from "react";
import styles from "@/app/styles/auth.module.css";
import { useRouter } from "next/navigation";
import { LinkButton } from "../link_button";
import { ErrorFormMessage } from "../posts/error_form";

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

  const [errMessage, setErrMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarChange = (e) => {
    setFormInputs({ ...formInputs, avatar: e.target.files[0] });
  };

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrMessage("");

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
          setErrMessage(result.error_message);
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
      setErrMessage("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <h1 className={styles.title}>Social Network</h1>
      <div className={styles.main_container}>
        <form
          className={styles.register}
          id="register_form"
          onSubmit={handleSubmit}
        >
          <div className={styles.header}>
            <h1>Create an account</h1>
          </div>

          <div className={styles.body}>
            <div className={styles.container}>
              <div className={styles.firstName}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  required
                  value={formInputs.firstName}
                  onChange={(e) =>
                    setFormInputs({ ...formInputs, firstName: e.target.value })
                  }
                />
              </div>
              <div className={styles.lastName}>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  required
                  value={formInputs.lastName}
                  onChange={(e) =>
                    setFormInputs({ ...formInputs, lastName: e.target.value })
                  }
                />
              </div>
              <div className={styles.nickName}>
                <input
                  type="text"
                  name="nickName"
                  placeholder="Nick Name (Optional)"
                  value={formInputs.nickName}
                  onChange={(e) =>
                    setFormInputs({ ...formInputs, nickName: e.target.value })
                  }
                />
              </div>
              <div className={styles.email}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  value={formInputs.email}
                  onChange={(e) =>
                    setFormInputs({ ...formInputs, email: e.target.value })
                  }
                />
              </div>
              <div className={styles.gender}>
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
              <div className={styles.birthDate}>
                <label htmlFor="birthDate" className={styles.label}>
                  Birth Date
                </label>
                <input
                  type="date"
                  name="birthDate"
                  placeholder="Birth Date"
                  required
                  value={formInputs.birthDate}
                  onChange={(e) =>
                    setFormInputs({ ...formInputs, birthDate: e.target.value })
                  }
                />
              </div>
              <div className={styles.password}>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  value={formInputs.password}
                  onChange={(e) =>
                    setFormInputs({ ...formInputs, password: e.target.value })
                  }
                />
              </div>
              <div className={styles.avatar}>
                <label htmlFor="file" className={styles.label}>
                  Upload Avatar/Image (Optional)
                </label>
                <input
                  id="file"
                  type="file"
                  name="avatar"
                  className={styles.fileInput}
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className={styles.aboutMe}>
                <textarea
                  name="aboutMe"
                  placeholder="About Me (Optional)"
                  value={formInputs.aboutMe}
                  onChange={(e) =>
                    setFormInputs({ ...formInputs, aboutMe: e.target.value })
                  }
                  rows="3"
                />
              </div>
              <div className={styles.submit}>
                <button
                  className={styles.button1}
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Registering..." : "Register"}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.container}>
              <LinkButton Link="/login" TextContent="Already have an account?" />
              <ErrorFormMessage Message={errMessage} />
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
