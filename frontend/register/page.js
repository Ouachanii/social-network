import React, { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    avatar: null,
    nickname: "",
    aboutMe: ""
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    const res = await fetch("/api/register", {
      method: "POST",
      body: formData
    });
    if (res.ok) {
      setMessage("Registration successful!");
    } else {
      setMessage("Registration failed.");
    }
  };

  return (
    <div className="register-form">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <input name="firstName" type="text" placeholder="First Name" value={form.firstName} onChange={handleChange} required />
        <input name="lastName" type="text" placeholder="Last Name" value={form.lastName} onChange={handleChange} required />
        <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required />
        <input name="avatar" type="file" accept="image/*" onChange={handleChange} />
        <input name="nickname" type="text" placeholder="Nickname (optional)" value={form.nickname} onChange={handleChange} />
        <textarea name="aboutMe" placeholder="About Me (optional)" value={form.aboutMe} onChange={handleChange} />
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
