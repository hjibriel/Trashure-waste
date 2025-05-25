const express = require('express');
const router = express.Router();
const db = require ('../dbconnector/index');

// Get all user rewards
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM trashure.user_rewards');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Create or Update user rewards
router.post("/", async (req, res) => {
    const { user_id, total_points } = req.body;

    try {
        // Check if the user already has a record in the user_rewards table
        const [existingUserReward] = await db.query('SELECT * FROM trashure.user_rewards WHERE user_id = ?', [user_id]);

        if (existingUserReward.length > 0) {
            // If the user already has a reward, update the total_points
            await db.query('UPDATE trashure.user_rewards SET total_points = ? WHERE user_id = ?', [total_points, user_id]);
            return res.status(200).json({ message: "User rewards updated" });
        } else {
            // If the user doesn't have a record, create a new one
            const [result] = await db.query('INSERT INTO trashure.user_rewards (user_id, total_points) VALUES (?, ?)', 
                [user_id, total_points]);
            return res.status(201).json({ message: "User rewards created", rewardId: result.insertId });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
