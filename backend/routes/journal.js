// journal.js
const express = require('express');
const journalRouter = express.Router();
const journalController = require('../controllers/journalController');
const { protect } = require('../middleware/auth');
const { journalValidation } = require('../middleware/validation');

journalRouter.use(protect);
journalRouter.get('/', journalController.getJournals);
journalRouter.get('/date/:date', journalController.getJournalByDate);
journalRouter.post('/', journalValidation.create, journalController.createJournal);
journalRouter.put('/:id', journalController.updateJournal);
journalRouter.delete('/:id', journalController.deleteJournal);

module.exports = journalRouter;
