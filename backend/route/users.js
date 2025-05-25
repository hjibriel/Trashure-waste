const express = require('express');
const router = express.Router();
const db = require('../dbconnector/index'); // Ensure this exports a MySQL promise-based pool

// Middleware to ensure JSON body parsing (also should be set in app.js)
router.use(express.json());

router.post('/', async (req, res) => {
    try {
        const webhookEvent = req.body;
        console.log("Received Clerk Webhook Event:", webhookEvent);

        // Only handle 'user.created' events
        if (webhookEvent.type === 'user.created') {
            const user = webhookEvent.data;

            const id = user.id;
            const email = user.email_addresses?.[0]?.email_address || null;
            const firstName = user.first_name || '';
            const lastName = user.last_name || '';

            console.log('Processing user:', { id, email, firstName, lastName });

            // Check if user already exists
            const [results] = await db.query(
                'SELECT user_id FROM trashure.users WHERE user_id = ? ',
                [id]
            );

            console.log("Database check result:", results);

            // If user does not exist, insert into database
            if (results.length === 0) {
                const insertQuery = `
                    INSERT INTO trashure.users (user_id, first_name, last_name, email)
                    VALUES (?, ?, ?, ?)
                `;
                const [insertResult] = await db.query(insertQuery, [id, firstName, lastName, email]);

                console.log('User added to database:', insertResult);
                res.status(200).send('User created and stored in database');
            } else {
                console.log('User already exists, skipping insert');
                res.status(200).send('User already exists');
            }
        } else {
            console.log("Unhandled event type:", webhookEvent.type);
            res.status(200).send('Event type not handled');
        }
    } catch (error) {
        console.error('Error in Clerk webhook handler:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
