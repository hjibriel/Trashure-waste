// route/reportwaste.js
const express = require('express');
const router = express.Router();
const db = require('../dbconnector/index');

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM trashure.waste_reports');
    res.json(rows);
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({ error: "Database error while fetching reports" });
  }
});

router.post("/", async (req, res) => {
  const {
    user_id,
    location,
    image_path,
    description,
    waste_type,
    priority,
    verification_status,
    points_awarded
  } = req.body;

  if (!user_id || !location || !image_path || !waste_type || !verification_status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const points = points_awarded || 10;

  try {
    const [result] = await db.query(
      `INSERT INTO trashure.waste_reports 
       (user_id, location, image_path, description, waste_type, priority, verification_status, points_awarded) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, location, image_path, description, waste_type, priority, verification_status, points]
    );

    res.status(201).json({ message: "Waste report created", reportId: result.insertId });
  } catch (err) {
    console.error("Error inserting waste report:", err);
    res.status(500).json({ error: "Database error while creating waste report" });
  }
});

module.exports = router;