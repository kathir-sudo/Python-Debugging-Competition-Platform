import { Router } from 'express';
import Team from '../models/Team.js';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import CompetitionState from '../models/CompetitionState.js';
import { MOCK_COMPETITION_STATE } from '../mockData.js';

const router = Router();

// --- Team Routes ---
router.get('/teams', async (req, res) => {
    try {
        res.json(await Team.find());
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ message: "Failed to fetch teams." });
    }
});
router.get('/teams/:id', async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: "Team not found." });
        res.json(team);
    } catch (error) {
        console.error(`Error fetching team ${req.params.id}:`, error);
        res.status(500).json({ message: "Failed to fetch team." });
    }
});

router.post('/teams/login', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ message: 'Team name must be a non-empty string.' });
        }
        const trimmedName = name.trim();
        
        // Escape special characters for regex safety
        const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const team = await Team.findOneAndUpdate(
            { teamName: { $regex: `^${escapedName}$`, $options: 'i' } }, // Case-insensitive find on teamName
            { $setOnInsert: { teamName: trimmedName, members: [trimmedName] } }, // Set teamName on insert
            { 
                new: true,          // Return the new or found document
                upsert: true,       // Create a new document if one doesn't exist
                runValidators: true // Ensure schema validations are run on insert
            }
        );

        res.status(200).json(team);
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 11000) {
            // This can happen in a race condition or if data is in a bad state (e.g., a null entry)
            return res.status(409).json({ message: 'A team with this name may already exist or there was a conflict. Please try again.' });
        }
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});


const handleTeamUpdate = async (req, res, update) => {
    try {
        const team = await Team.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!team) return res.status(404).json({ message: "Team not found" });
        res.json(team);
    } catch (error) {
        console.error(`Error updating team ${req.params.id}:`, error);
        res.status(500).json({ message: "Failed to update team." });
    }
};

router.post('/teams/:id/violation', (req, res) => handleTeamUpdate(req, res, { $inc: { violations: 1 } }));
router.post('/teams/:id/tabswitch-violation', (req, res) => handleTeamUpdate(req, res, { $inc: { tabSwitchViolations: 1 } }));
router.post('/teams/:id/disqualify', (req, res) => handleTeamUpdate(req, res, { isDisqualified: true }));
router.post('/teams/:id/revert-dq', (req, res) => handleTeamUpdate(req, res, { isDisqualified: false }));

router.put('/teams/:id/score', (req, res) => {
    const { score } = req.body;
    if (typeof score !== 'number') {
        return res.status(400).json({ message: "Score must be a number." });
    }
    handleTeamUpdate(req, res, { score });
});

router.put('/teams/:id/status', (req, res) => {
    const { status } = req.body;
    let update = {};
    switch (status) {
        case 'active':
            update = { isDisqualified: false, hasFinished: false };
            break;
        case 'finished':
            update = { isDisqualified: false, hasFinished: true };
            break;
        case 'disqualified':
            update = { isDisqualified: true, hasFinished: false };
            break;
        default:
            return res.status(400).json({ message: "Invalid status provided." });
    }
    handleTeamUpdate(req, res, update);
});

router.post('/teams/:id/finish', (req, res) => handleTeamUpdate(req, res, { hasFinished: true }));


router.delete('/teams/:id', async (req, res) => {
    await Team.findByIdAndDelete(req.params.id);
    res.status(204).send();
});

router.delete('/teams/:id/submissions', async (req, res) => {
    try {
        const teamId = req.params.id;
        
        // Delete submissions
        await Submission.deleteMany({ teamId: teamId });
        
        // Reset team score
        const team = await Team.findByIdAndUpdate(
            teamId, 
            { score: 0, lastSubmissionTimestamp: null }, 
            { new: true }
        );

        if (!team) return res.status(404).json({ message: "Team not found after clearing submissions." });

        res.status(204).send();
    } catch (error) {
        console.error(`Error clearing submissions for team ${req.params.id}:`, error);
        res.status(500).json({ message: "Failed to clear team submissions." });
    }
});


// --- Admin Routes ---
router.post('/admin/login', (req, res) => {
    if (req.body.password === 'admin123') {
        res.json({ id: 'admin', name: 'Admin' });
    } else {
        res.status(401).json({ message: 'Invalid admin password' });
    }
});


// --- Problem Routes ---
router.get('/problems', async (req, res) => {
    try {
        res.json(await Problem.find());
    } catch (error) {
        console.error("Error fetching problems:", error);
        res.status(500).json({ message: "Failed to fetch problems." });
    }
});

router.post('/problems', async (req, res) => {
    try {
        const newProblem = new Problem(req.body);
        await newProblem.save();
        res.status(201).json(newProblem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/problems/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProblem = await Problem.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedProblem) return res.status(404).json({ message: 'Problem not found' });
        res.json(updatedProblem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/problems/:id', async (req, res) => {
    try {
        const deletedProblem = await Problem.findByIdAndDelete(req.params.id);
        if (!deletedProblem) return res.status(404).json({ message: 'Problem not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// --- Submission Routes ---
router.get('/submissions', async (req, res) => {
    try {
        res.json(await Submission.find().sort({ timestamp: -1 }));
    } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({ message: "Failed to fetch submissions." });
    }
});
router.get('/submissions/team/:teamId', async (req, res) => {
    try {
        const submissions = await Submission.find({ teamId: req.params.teamId }).sort({ timestamp: -1 });
        res.json(submissions);
    } catch (error) {
        console.error(`Error fetching submissions for team ${req.params.teamId}:`, error);
        res.status(500).json({ message: "Failed to fetch submissions for team." });
    }
});

router.post('/submissions', async (req, res) => {
    const { teamId, problemId, code, results } = req.body;
    const score = results.filter(r => r.passed).length;

    const team = await Team.findById(teamId);
    const problem = await Problem.findById(problemId);

    if (!team || !problem) {
        return res.status(404).json({ message: 'Team or Problem not found' });
    }

    const submission = await Submission.create({
        teamId,
        teamName: team.teamName, // Use teamName from the team document
        problemId,
        problemTitle: problem.title,
        code,
        results,
        score,
        timestamp: Date.now(),
    });

    // Recalculate team's total score based on their best submission for each problem
    const teamSubmissions = await Submission.find({ teamId });
    const bestScores = teamSubmissions.reduce((acc, sub) => {
        if (!acc[sub.problemId] || acc[sub.problemId].score < sub.score) {
            acc[sub.problemId] = { score: sub.score, timestamp: sub.timestamp };
        }
        return acc;
    }, {});
    
    team.score = Object.values(bestScores).reduce((sum, s) => sum + s.score, 0);
    team.lastSubmissionTimestamp = Math.max(...Object.values(bestScores).map(s => s.timestamp));
    await team.save();

    res.status(201).json(submission);
});


// --- Competition State Routes ---
router.get('/competition/state', async (req, res) => {
    try {
        let state = await CompetitionState.findOne();
        if (!state) {
            console.warn("Competition state not found in DB, creating a default one to prevent client errors.");
            state = await CompetitionState.create(MOCK_COMPETITION_STATE);
        }
        res.json(state);
    } catch (error) {
        console.error("Error fetching competition state:", error);
        res.status(500).json({ message: "Failed to retrieve competition state." });
    }
});

router.put('/competition/state', async (req, res) => {
    const state = await CompetitionState.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(state);
});

router.post('/competition/toggle-pause', async (req, res) => {
    try {
        const state = await CompetitionState.findOne();
        if (!state) return res.status(404).json({ message: "Competition state not found." });
        const newState = await CompetitionState.findByIdAndUpdate(state._id, { isPaused: !state.isPaused }, { new: true });
        res.json(newState);
    } catch(error) {
        res.status(500).json({ message: "Failed to toggle pause state." });
    }
});

router.put('/competition/announcement', async (req, res) => {
    const { message } = req.body;
    if (typeof message !== 'string') {
        return res.status(400).json({ message: "Announcement message must be a string." });
    }
    const announcement = {
        message,
        timestamp: Date.now(),
    };
    const state = await CompetitionState.findOneAndUpdate({}, { announcement }, { new: true, upsert: true });
    res.json(state);
});

export default router;