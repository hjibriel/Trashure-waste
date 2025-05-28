const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');


const app = express();
dotenv.config();

app.use(express.json());

const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json()); 


const usersRoutes = require('./route/users');
app.use('/api/users', usersRoutes); 

const reportwasteRoutes = require('./route/reportwaste');
app.use('/api/reportwaste', reportwasteRoutes);

const collectRoutes = require('./route/collectwaste');
app.use('/api/collect', collectRoutes);

const pickuprequestRoutes = require('./route/pickuprequest');
app.use('/api/pickuprequest', pickuprequestRoutes);

const userRewardsRoutes = require('./route/userRewards');
app.use('/api/userRewards', userRewardsRoutes);

const rewardTransactionsRoutes = require('./route/usertransaction');
app.use('/api/rewardTransactions', rewardTransactionsRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
