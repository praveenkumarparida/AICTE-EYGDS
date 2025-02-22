import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const navigate = useNavigate();

  const checkPasswordStrength = (password) => {
    const lengthCriteria = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);

    if (password.length === 0) {
      setPasswordStrength("");
    } else if (password.length < 6) {
      setPasswordStrength("Weak ❌");
    } else if (hasUpperCase && hasNumbers && hasSpecialChars) {
      setPasswordStrength("Strong ✅");
    } else if (lengthCriteria && (hasUpperCase || hasNumbers)) {
      setPasswordStrength("Medium ⚠️");
    } else {
      setPasswordStrength("Weak ❌");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!username || !password || !confirmPassword) {
      toast.error("All fields are required!");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5001/signup", { username, password });
      toast.success(response.data.message || "Signup successful! Redirecting...");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed. Try again.");
    }
  };

  return (
    <div style={styles.container}>
      <ToastContainer position="top-center" autoClose={2000} />
      <div style={styles.card}>
        <h2 style={styles.title}>Create an Account</h2>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />
          <div style={styles.passwordWrapper}>
            <input
              type={passwordVisible ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                checkPasswordStrength(e.target.value);
              }}
              required
              style={styles.input}
            />
            <span onClick={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIcon}>
              {passwordVisible ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {password && <p style={styles.passwordStrength}>{passwordStrength}</p>}
          <div style={styles.passwordWrapper}>
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
            />
            <span onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)} style={styles.eyeIcon}>
              {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <button type="submit" style={styles.button}>Sign Up</button>
        </form>
        <p style={styles.text}>
          Already have an account? <a href="/signin" style={styles.link}>Sign in</a>
        </p>
      </div>
    </div>
  );
};

// Inline Styles (With Responsive Design)
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    // height: "100vh",
    background: "linear-gradient(135deg, #74ebd5, #acb6e5)",
    padding: "20px",
  },
  card: {
    background: "#fff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    width: "90%",
    maxWidth: "400px",
  },
  title: {
    marginBottom: "20px",
    fontSize: "22px",
    fontWeight: "600",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "12px",
    margin: "8px 0",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "16px",
    transition: "0.3s",
  },
  passwordWrapper: {
    position: "relative",
    width: "100%",
  },
  eyeIcon: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    fontSize: "18px",
    color: "#555",
  },
  passwordStrength: {
    textAlign: "left",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#555",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "12px",
    transition: "0.3s",
  },
  text: {
    marginTop: "12px",
    fontSize: "14px",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
  },
};

// Make styles responsive
if (window.innerWidth < 600) {
  styles.card.width = "100%";
  styles.card.padding = "20px";
  styles.input.padding = "10px";
  styles.button.padding = "10px";
}

export default Signup;
