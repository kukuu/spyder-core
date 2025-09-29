const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

// Simple LLM service implementation
class SimpleLLMService {
  async processQuery(question, maxRecords = 20) {
    try {
      // Get recent readings for context
      const { data: readingsData, error: readingsError } = await supabase
        .from('readings')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (readingsError) throw readingsError;

      // Simulate LLM response based on data
      const response = this.generateResponse(question, readingsData);
      
      return {
        success: true,
        answer: response
      };

    } catch (error) {
      console.error('Error processing LLM query:', error);
      return {
        success: false,
        error: error.message,
        answer: 'Sorry, I encountered an error processing your question. Please try again.'
      };
    }
  }

  generateResponse(question, readingsData) {
    // Simple rule-based response generator
    if (question.toLowerCase().includes('performance') || question.toLowerCase().includes('meter')) {
      return this.generatePerformanceAnalysis(readingsData);
    } else if (question.toLowerCase().includes('trend') || question.toLowerCase().includes('pattern')) {
      return this.generateTrendAnalysis(readingsData);
    } else if (question.toLowerCase().includes('anomaly') || question.toLowerCase().includes('issue')) {
      return this.generateAnomalyDetection(readingsData);
    } else {
      return this.generateGeneralResponse(question, readingsData);
    }
  }

  generatePerformanceAnalysis(readingsData) {
    const meterStats = {};
    readingsData.forEach(reading => {
      if (!meterStats[reading.meter_id]) {
        meterStats[reading.meter_id] = { readings: [], sum: 0 };
      }
      meterStats[reading.meter_id].readings.push(reading.reading);
      meterStats[reading.meter_id].sum += reading.reading;
    });

    let analysis = '<h3>Meter Performance Analysis:</h3>';
    for (const meterId in meterStats) {
      const stats = meterStats[meterId];
      const avg = stats.sum / stats.readings.length;
      const max = Math.max(...stats.readings);
      const min = Math.min(...stats.readings);
      
      analysis += `
        <div style="margin-bottom: 15px;">
          <h4>Meter ${meterId}</h4>
          <ul>
            <li>Average Reading: ${avg.toFixed(2)}</li>
            <li>Maximum Reading: ${max.toFixed(2)}</li>
            <li>Minimum Reading: ${min.toFixed(2)}</li>
            <li>Total Readings: ${stats.readings.length}</li>
          </ul>
        </div>
      `;
    }
    
    return analysis;
  }

  generateTrendAnalysis(readingsData) {
    // Simple trend analysis
    const recentReadings = readingsData.slice(0, 10);
    let trend = 'stable';
    
    if (recentReadings.length >= 2) {
      const first = recentReadings[recentReadings.length - 1].reading;
      const last = recentReadings[0].reading;
      const change = ((last - first) / first) * 100;
      
      if (change > 5) trend = 'increasing';
      else if (change < -5) trend = 'decreasing';
    }

    return `
      <h3>Energy Consumption Trends</h3>
      <p>Based on recent data analysis:</p>
      <ul>
        <li>Current trend: <strong>${trend}</strong></li>
        <li>Sample size: ${recentReadings.length} readings</li>
        <li>Latest reading: ${recentReadings[0]?.reading || 'N/A'}</li>
      </ul>
      <p>Recommendation: ${this.getTrendRecommendation(trend)}</p>
    `;
  }

  getTrendRecommendation(trend) {
    const recommendations = {
      increasing: 'Consider investigating increased consumption patterns',
      decreasing: 'Good energy efficiency maintained',
      stable: 'Energy usage patterns are consistent'
    };
    return recommendations[trend] || 'Monitor energy consumption regularly';
  }

  generateAnomalyDetection(readingsData) {
    // Simple anomaly detection
    const values = readingsData.map(r => r.reading);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const threshold = avg * 0.2; // 20% threshold
    
    const anomalies = readingsData.filter(r => Math.abs(r.reading - avg) > threshold);
    
    return `
      <h3>Anomaly Detection Report</h3>
      <p>Analysis of ${readingsData.length} readings:</p>
      <ul>
        <li>Average reading: ${avg.toFixed(2)}</li>
        <li>Anomalies detected: ${anomalies.length}</li>
        <li>Anomaly threshold: ±${threshold.toFixed(2)}</li>
      </ul>
      ${anomalies.length > 0 ? `
        <h4>Potential Issues:</h4>
        <ul>
          ${anomalies.slice(0, 3).map(anomaly => `
            <li>Meter ${anomaly.meter_id}: ${anomaly.reading} (${new Date(anomaly.timestamp).toLocaleString()})</li>
          `).join('')}
        </ul>
      ` : '<p>No significant anomalies detected.</p>'}
    `;
  }

  generateGeneralResponse(question, readingsData) {
    return `
      <h3>Energy Data Analysis</h3>
      <p>You asked: "<strong>${question}</strong>"</p>
      <p>Based on analysis of ${readingsData.length} meter readings:</p>
      <ul>
        <li>Data covers multiple meters with real-time monitoring</li>
        <li>Latest readings show active energy consumption patterns</li>
        <li>System is operational and collecting data</li>
      </ul>
      <p>For more specific analysis, try asking about:
        <ul>
          <li>Meter performance</li>
          <li>Consumption trends</li>
          <li>Anomaly detection</li>
          <li>Energy efficiency</li>
        </ul>
      </p>
    `;
  }

  async saveEnergyAnalysis(question, answer, meterId = 1, maxRecords = 20) {
    try {
      // Check current record count
      const { count } = await supabase
        .from('energy_analyses')
        .select('*', { count: 'exact' });

      // Delete oldest records if over limit
      if (count >= maxRecords) {
        const { data: oldRecords } = await supabase
          .from('energy_analyses')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(count - maxRecords + 1);

        const idsToDelete = oldRecords.map(record => record.id);
        await supabase
          .from('energy_analyses')
          .delete()
          .in('id', idsToDelete);
      }

      // Insert new analysis
      const { data, error } = await supabase
        .from('energy_analyses')
        .insert([
          {
            meter_id: meterId,
            questions: question,
            response: answer,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error saving energy analysis:', error);
      throw error;
    }
  }
}

const llmService = new SimpleLLMService();

// LLM Query endpoint
router.post('/query', async (req, res) => {
  try {
    const { question, maxRecords = 20 } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Process the query
    const result = await llmService.processQuery(question, maxRecords);

    if (result.success) {
      // Get the most recent meter_id from readings
      const { data: recentReading } = await supabase
        .from('readings')
        .select('meter_id')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      const meterId = recentReading ? recentReading.meter_id : 1;
      
      // Save to database
      await llmService.saveEnergyAnalysis(question, result.answer, meterId, maxRecords);
      
      res.json({
        success: true,
        answer: result.answer
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in LLM query endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get recent analyses
router.get('/analyses', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const { data, error } = await supabase
      .from('energy_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;
    
    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;