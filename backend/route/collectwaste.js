// /route/collectwaste.js
const express = require('express');
const router = express.Router();
const db = require('../dbconnector/index');

// Get all waste collection records
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM trashure.waste_collection');
        res.json(rows);
    } catch (err) {
        console.error("GET Error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// Create a new waste collection record
router.post("/", async (req, res) => {
    const { user_id, location, weight, method, points_earned } = req.body;

    if (!user_id || !location || !weight || !method || points_earned == null) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO trashure.waste_collection 
            (user_id, location, weight, method, points_earned) 
            VALUES (?, ?, ?, ?, ?)`, 
            [user_id, location, weight, method, points_earned]
        );

        res.status(201).json({ 
            message: "Waste collection record created", 
            collectionId: result.insertId 
        });
    } catch (err) {
        console.error("POST Error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
