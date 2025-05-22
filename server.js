import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = 3001;

// CORS configuration
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'clientversion'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Proxy endpoint for GraphQL requests
app.post('/api/graphql', async (req, res) => {
    try {
        const response = await axios.post('https://api.pluralsight.com/graphql', 
            req.body,
            {
                headers: {
                    'Authorization': req.headers.authorization,
                    'clientversion': req.headers.clientversion || 'SSP Automation 1.0',
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error proxying request:', error);
        res.status(500).json({ 
            error: 'Failed to proxy request',
            details: error.response?.data || error.message
        });
    }
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 