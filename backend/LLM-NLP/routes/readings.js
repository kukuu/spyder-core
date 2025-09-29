// backend/LLM-NLP/routes/readings.js
const express = require('express');
const ReadingsService = require('../services/readingsService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all readings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const readings = await ReadingsService.getAllReadings(parseInt(limit));
    res.json({ success: true, data: readings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get readings by meter ID
router.get('/meter/:meter_id', authenticateToken, async (req, res) => {
  try {
    const { meter_id } = req.params;
    const { limit = 50 } = req.query;
    const readings = await ReadingsService.getReadingsByMeterId(meter_id, parseInt(limit));
    res.json({ success: true, data: readings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get readings within time range
router.get('/time-range', authenticateToken, async (req, res) => {
  try {
    const { start, end, meter_id } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ success: false, error: 'Start and end time parameters are required' });
    }

    const readings = await ReadingsService.getReadingsByTimeRange(start, end, meter_id || null);
    res.json({ success: true, data: readings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new reading
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { meter_id, reading } = req.body;
    
    if (!meter_id || reading === undefined) {
      return res.status(400).json({ success: false, error: 'Meter ID and reading are required' });
    }

    const newReading = await ReadingsService.addReading(meter_id, reading);
    res.status(201).json({ success: true, data: newReading });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get latest reading for a meter
router.get('/latest/:meter_id', authenticateToken, async (req, res) => {
  try {
    const { meter_id } = req.params;
    const reading = await ReadingsService.getLatestReading(meter_id);
    res.json({ success: true, data: reading });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get meter statistics
router.get('/stats/:meter_id', authenticateToken, async (req, res) => {
  try {
    const { meter_id } = req.params;
    const stats = await ReadingsService.getMeterStatistics(meter_id);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all unique meter IDs
router.get('/meters', authenticateToken, async (req, res) => {
  try {
    const meterIds = await ReadingsService.getUniqueMeterIds();
    res.json({ success: true, data: meterIds });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;