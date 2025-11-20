import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';

import Problem from './models/Problem.js';
import CompetitionState from './models/CompetitionState.js';
import { MOCK_PROBLEMS, MOCK_COMPETITION_STATE } from './mockData.js';

// ES module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// --- PRODUCTION BUILD SERVING ---
// Serve the static files from the React app's build directory
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.use('/api', apiRoutes);

// The "catchall" handler for client-side routing: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});


// Database Connection
if (!process.env.MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined.');
  console.error('Please create a .env file in the /server directory and add your MongoDB connection string.');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} and accessible on your local network.`));
    seedDatabase();
  })
  .catch(err => console.error('Could not connect to MongoDB', err));


// Seed database with initial data if it's empty
const seedDatabase = async () => {
    try {
        const problemCount = await Problem.countDocuments();
        if (problemCount === 0) {
            console.log('No problems found, seeding database...');
            await Problem.insertMany(MOCK_PROBLEMS);
            console.log('Problems seeded.');
        }

        const stateCount = await CompetitionState.countDocuments();
        if (stateCount === 0) {
            console.log('No competition state found, creating default...');
            await CompetitionState.create(MOCK_COMPETITION_STATE);
            console.log('Competition state created.');
        }

    } catch (error) {
        console.error('Error seeding database:', error);
    }
};