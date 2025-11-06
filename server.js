const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
const PANEL_URL = 'https://masvilxbuyerpanel.storedigital.web.id'; // GANTI

// PLTC API Key
const PLTC_API_KEY = 'ptlc_3tgBdNFoFFXeEipDhlKxfKnCGby44c1ruMdp6u9JDTd';

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Serve login page
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, "public", "HCS-View", "Login.html");
  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) return res.status(500).send("❌ Gagal baca Login.html");
    res.send(html);
  });
});

app.get('/login', (req, res) => {
  const filePath = path.join(__dirname, "public", "HCS-View", "Login.html");
  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) return res.status(500).send("❌ Gagal baca Login.html");
    res.send(html);
  });
});

// Auth endpoint dengan PLTC
app.post('/auth', async (req, res) => {
  try {
    const { username, key } = req.body;
    console.log(`Login attempt: ${username}`);
    
    const response = await axios.post(`${PANEL_URL}/auth`, { 
      username, key 
    }, {
      headers: {
        'Authorization': `Bearer ${PLTC_API_KEY}`,
        'X-PLTC-Key': PLTC_API_KEY
      }
    });
    
    console.log('Panel response:', response.data);
    
    if (response.data && response.data.success) {
      res.cookie("sessionUser", username, { maxAge: 60 * 60 * 1000, httpOnly: true });
      res.redirect("/execution");
    } else {
      const errorMsg = response.data?.message || "Invalid credentials";
      res.redirect("/login?msg=" + encodeURIComponent(errorMsg));
    }
  } catch (error) {
    console.error("Auth error:", error.response?.data || error.message);
    res.redirect("/login?msg=" + encodeURIComponent("Server error: " + error.message));
  }
});

// Execution page dengan PLTC
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
        'SessionUser': username,
        'Authorization': `Bearer ${PLTC_API_KEY}`,
        'X-PLTC-Key': PLTC_API_KEY
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

// Vercel butuh ini
module.exports = app;