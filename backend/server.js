const express = require("express");
const fs = require("fs");
const bcrypt = require("bcrypt");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;
const API_KEY = "EXAM2024-KEY-5678";
const USERS_FILE = "users.json";

app.use(cors());
app.use(bodyParser.json());

// Load users from file
const loadUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Save users to file
const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Register a new user
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const users = loadUsers();
  const userExists = users.find((user) => user.email === email);
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, email, password: hashedPassword });
  saveUsers(users);

  res.status(201).json({ message: "User registered successfully" });
});

// Login user
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();
  const user = users.find((user) => user.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.status(200).json({ message: "Login successful", username: user.username, email: user.email });
});

// Get user profile (Protected Route)
app.get("/api/profile", (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ message: "Invalid API key" });
  }

  const users = loadUsers();
  res.status(200).json(users);
});

// Update username
app.patch("/api/profile", (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ message: "Invalid API key" });
  }

  const { email, newUsername } = req.body;
  if (!newUsername || /[^a-zA-Z0-9]/.test(newUsername)) {
    return res.status(400).json({ message: "Invalid username" });
  }

  let users = loadUsers();
  const userIndex = users.findIndex((user) => user.email === email);
  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  users[userIndex].username = newUsername;
  saveUsers(users);
  res.status(200).json({ message: "Username updated successfully" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
