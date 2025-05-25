const express = require('express');
const router = express.Router();
const db = require('../dbconnector/index');


router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM trashure.pickup_requests ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});


router.post("/", async (req, res) => {
    const {
        user_id,
        waste_type,
        quantity,
        description,
        location,
        preferred_date,
        preferred_time
    } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO trashure.pickup_requests 
             (user_id, waste_type, quantity, description, location, preferred_date, preferred_time) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, waste_type, quantity, description, location, preferred_date, preferred_time]
        );
        res.status(201).json({ message: "Pickup request created", requestId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});



// Update Pickup Request (allow partial update)
router.put("/:id", async (req, res) => {
    const fields = [];
    const values = [];
    const requestId = req.params.id;

    if (req.body.waste_type) fields.push("waste_type = ?"), values.push(req.body.waste_type);
    if (req.body.quantity) fields.push("quantity = ?"), values.push(req.body.quantity);
    if (req.body.description) fields.push("description = ?"), values.push(req.body.description);
    if (req.body.location) fields.push("location = ?"), values.push(req.body.location);
    if (req.body.preferred_date) fields.push("preferred_date = ?"), values.push(req.body.preferred_date);
    if (req.body.preferred_time) fields.push("preferred_time = ?"), values.push(req.body.preferred_time);

    if (fields.length === 0) return res.status(400).json({ error: "No valid fields to update" });

    try {
        const [result] = await db.query(
            `UPDATE trashure.pickup_requests SET ${fields.join(", ")} WHERE request_id = ?`,
            [...values, requestId]
        );
        res.json({ message: "Pickup request updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Delete Pickup Request
router.delete("/:id", async (req, res) => {
    const requestId = req.params.id;
    try {
        await db.query('DELETE FROM trashure.pickup_requests WHERE request_id = ?', [requestId]);
        res.json({ message: "Pickup request deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Add Waste Collection Record


module.exports = router;
