const cors = require("cors");
const express = require("express");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// ตั้งค่าการเชื่อมต่อ MySQL (XAMPP)
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // ค่าเริ่มต้น XAMPP ไม่มีรหัสผ่าน
  database: "hfinance_db",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("Connected to XAMPP MySQL Database!");
});

// ==================== USERS & AUTH ====================

// สมัครสมาชิก (Register)
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  const query =
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

  db.query(query, [username, email, password], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Email already exists or database error",
        error: err,
      });
    }
    res.json({
      success: true,
      message: "Registered successfully",
      userId: result.insertId,
    });
  });
});

// เข้าสู่ระบบ (Login)
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM users WHERE email = ? AND password = ?";

  db.query(query, [email, password], (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Database error", error: err });
    }
    if (results.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    res.json({ success: true, message: "Login successful", user: results[0] });
  });
});

// ออกจากระบบ (Logout - รองรับไว้กัน Error)
app.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// ==================== WATCHLIST ====================

// ดึง Watchlist ของผู้ใช้
app.get("/watchlist/:user_id", (req, res) => {
  const userId = req.params.user_id;
  const query = "SELECT * FROM watchlist WHERE user_id = ?";

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err });
    }
    res.json({ success: true, data: results });
  });
});

// เพิ่มหุ้นลง Watchlist
app.post("/watchlist", (req, res) => {
  const { user_id, symbol, name } = req.body;
  const query =
    "INSERT INTO watchlist (user_id, symbol, name) VALUES (?, ?, ?)";

  db.query(query, [user_id, symbol, name], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err });
    }
    res.json({
      success: true,
      message: "Added to watchlist successfully",
      id: result.insertId,
    });
  });
});

// ลบหุ้นออกจาก Watchlist
app.delete("/watchlist/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM watchlist WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err });
    }
    res.json({ success: true, message: "Removed from watchlist successfully" });
  });
});

// ==================== PORTFOLIO ====================

// ดึงพอร์ตการลงทุนของผู้ใช้
app.get("/portfolio/:user_id", (req, res) => {
  const userId = req.params.user_id;
  const query = "SELECT * FROM portfolio WHERE user_id = ?";

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err });
    }
    res.json({ success: true, data: results });
  });
});

// เพิ่มหุ้นเข้าพอร์ตการลงทุน
app.post("/portfolio", (req, res) => {
  const { user_id, symbol, name, shares, buy_price } = req.body;
  const query =
    "INSERT INTO portfolio (user_id, symbol, name, shares, buy_price) VALUES (?, ?, ?, ?, ?)";

  db.query(query, [user_id, symbol, name, shares, buy_price], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err });
    }
    res.json({
      success: true,
      message: "Added to portfolio successfully",
      id: result.insertId,
    });
  });
});

// ลบหุ้นออกจากพอร์ต
app.delete("/portfolio/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM portfolio WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err });
    }
    res.json({ success: true, message: "Removed from portfolio successfully" });
  });
});

// ==================== SEARCH HISTORY (ถ้ามีใช้งาน) ====================
app.post("/search-history", (req, res) => {
  // รองรับการบันทึกประวัติการค้นหา (ถ้ามีตารางใน DB) หรือตอบกลับสำเร็จ
  res.json({ success: true, message: "Search history saved" });
});

// ==================== SERVER START ====================
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
