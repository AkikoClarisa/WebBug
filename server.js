const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const PANEL_URL = 'https://masvilxbuyerpanel.storedigital.web.id'; // GANTI DENGAN DOMAIN PANEL MU

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Serve login page
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, "HCS-View", "Login.html");
  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) return res.status(500).send("❌ Gagal baca Login.html");
    res.send(html);
  });
});

app.get('/login', (req, res) => {
  const filePath = path.join(__dirname, "HCS-View", "Login.html");
  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) return res.status(500).send("❌ Gagal baca Login.html");
    res.send(html);
  });
});

// Auth endpoint
app.post('/auth', async (req, res) => {
  try {
    const { username, key } = req.body;
    const response = await axios.post(`${PANEL_URL}/auth`, { username, key });
    
    if (response.data.success) {
      res.cookie("sessionUser", username, { maxAge: 60 * 60 * 1000, httpOnly: true });
      res.redirect("/execution");
    } else {
      res.redirect("/login?msg=" + encodeURIComponent(response.data.message || "Login failed"));
    }
  } catch (error) {
    console.error("Auth error:", error.message);
    res.redirect("/login?msg=" + encodeURIComponent("Error connecting to panel"));
  }
});

// Execution page - proxy ke panel
app.get('/execution', async (req, res) => {
  try {
    const username = req.cookies.sessionUser;
    const { target, mode } = req.query;

    if (!username) {
      return res.redirect("/login?msg=Session expired");
    }

    const response = await axios.get(`${PANEL_URL}/api/execution`, {
      params: { target, mode },
      headers: { 
        'Cookie': `sessionUser=${username}`,
        'SessionUser': username 
      }
    });

    res.send(response.data);
  } catch (error) {
    console.error("Execution error:", error.message);
    res.redirect("/login?msg=" + encodeURIComponent("Error connecting to panel"));
  }
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie("sessionUser");
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`✅ Web Natifly aktif di port ${PORT}`);
  console.log(`🔗 Connected to panel: ${PANEL_URL}`);
});