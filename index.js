const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { graphqlHTTP } = require('express-graphql');
const schema = require('./api/index');
const connectDB = require('./config/db');
const port = process.env.PORT || 5000;
const bodyParser = require('body-parser');
const app = express();

connectDB();

app.use(cors({
  origin: ['https://react-manage-projects.vercel.app'], 
  credentials: true,
  methods: ["POST", "GET", "DELETE", "UPDATE"]
}));

app.use(bodyParser.json({limit: '35mb'}));

app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '35mb',
    parameterLimit: 50000,
  }),
);
app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: process.env.NODE_ENV === 'development'
}));
app.listen(port, console.log(`Server running on port ${port}`));