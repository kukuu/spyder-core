// backend/LLM-NLP/services/readingsService.js
const { supabase } = require('../config/database');

class ReadingsService {
  // Get all readings
  static async getAllReadings(limit = 100) {
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Get readings by meter_id
  static async getReadingsByMeterId(meter_id, limit = 50) {
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('meter_id', meter_id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Get readings within time range
  static async getReadingsByTimeRange(startTime, endTime, meter_id = null) {
    let query = supabase
      .from('readings')
      .select('*')
      .gte('timestamp', startTime)
      .lte('timestamp', endTime)
      .order('timestamp', { ascending: true });

    if (meter_id) {
      query = query.eq('meter_id', meter_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  // Add new reading
  static async addReading(meter_id, reading) {
    const { data, error } = await supabase
      .from('readings')
      .insert([
        {
          meter_id,
          reading,
          timestamp: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Get latest reading for a specific meter
  static async getLatestReading(meter_id) {
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('meter_id', meter_id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  }

  // Get meter statistics
  static async getMeterStatistics(meter_id) {
    const { data, error } = await supabase
      .from('readings')
      .select('reading, timestamp')
      .eq('meter_id', meter_id)
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) throw error;

    if (data.length === 0) {
      return { average: 0, max: 0, min: 0, count: 0, latest: null };
    }

    const readings = data.map(r => parseFloat(r.reading));
    const average = readings.reduce((sum, val) => sum + val, 0) / readings.length;
    
    return {
      average: Math.round(average * 100) / 100,
      max: Math.max(...readings),
      min: Math.min(...readings),
      count: readings.length,
      latest: data[0]
    };
  }

  // Get all unique meter IDs
  static async getUniqueMeterIds() {
    const { data, error } = await supabase
      .from('readings')
      .select('meter_id')
      .order('meter_id');

    if (error) throw error;

    // Extract unique meter IDs
    const uniqueMeters = [...new Set(data.map(item => item.meter_id))];
    return uniqueMeters;
  }
}

module.exports = ReadingsService;