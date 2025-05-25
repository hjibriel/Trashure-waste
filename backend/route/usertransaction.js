const express = require('express');
const router = express.Router();
const db = require ('../dbconnector/index');

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM trashure.reward_transactions');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

router.post("/", async (req, res) => {
    const { user_id, transaction_type, description, points } = req.body;
    try {
        const [result] = await db.query('INSERT INTO trashure.reward_transactions (user_id, transaction_type, description, points) VALUES (?, ?, ?, ?)', 
            [user_id, transaction_type, description, points]);
        res.status(201).json({ message: "Reward transaction added", transactionId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});



module.exports = router;