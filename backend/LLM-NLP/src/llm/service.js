const { SupabaseVectorStore } = require('@langchain/community/vectorstores/supabase');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { ChatOpenAI } = require('@langchain/openai');
const { createClient } = require('@supabase/supabase-js');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');

// Initialize clients
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const openAIApiKey = process.env.OPENAI_API_KEY;

const supabaseClient = createClient(supabaseUrl, supabaseKey);

class LLMService {
  constructor() {
    this.embeddings = new OpenAIEmbeddings({ openAIApiKey });
    this.llm = new ChatOpenAI({
      openAIApiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1
    });
  }

  async processQuery(question, maxRecords = 20) {
    try {
      // Retrieve relevant context from readings table
      const { data: readingsData, error: readingsError } = await supabaseClient
        .from('readings')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (readingsError) throw readingsError;

      // Retrieve recent analyses for context
      const { data: analysesData, error: analysesError } = await supabaseClient
        .from('energy_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (analysesError) throw analysesError;

      // Format the data for context
      const readingsContext = this.formatReadingsContext(readingsData);
      const analysesContext = this.formatAnalysesContext(analysesData);
      
      // Create prompt template
      const prompt = PromptTemplate.fromTemplate(`
        You are Jim, an energy analytics expert at Energy Tariffs Check. Analyze the following energy data and provide insights.

        Recent Meter Readings:
        {readingsContext}

        Recent Analysis History:
        {analysesContext}

        User Question: {question}

        Please provide a comprehensive analysis including:
        1. Key insights from the data
        2. Any anomalies or patterns detected
        3. Recommendations if applicable
        4. Answer the specific question asked

        Format your response in HTML with proper formatting for a web page.
        Use headings, paragraphs, lists, and emphasis where appropriate.
      `);

      // Create processing chain
      const chain = RunnableSequence.from([
        prompt,
        this.llm,
        new StringOutputParser()
      ]);

      // Generate response
      const response = await chain.invoke({
        readingsContext: readingsContext,
        analysesContext: analysesContext,
        question: question
      });

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

  formatReadingsContext(readings) {
    if (!readings || readings.length === 0) {
      return "No recent meter readings available.";
    }

    // Group readings by meter_id
    const readingsByMeter = {};
    readings.forEach(reading => {
      if (!readingsByMeter[reading.meter_id]) {
        readingsByMeter[reading.meter_id] = [];
      }
      readingsByMeter[reading.meter_id].push(reading);
    });

    // Format the context string
    let context = "";
    for (const meterId in readingsByMeter) {
      context += `<strong>Meter ${meterId}:</strong><br>`;
      readingsByMeter[meterId].slice(0, 5).forEach(reading => {
        context += `  - ${new Date(reading.timestamp).toLocaleString()}: ${reading.reading} units<br>`;
      });
      context += "<br>";
    }

    return context;
  }

  formatAnalysesContext(analyses) {
    if (!analyses || analyses.length === 0) {
      return "No previous analysis history available.";
    }

    let context = "";
    analyses.forEach(analysis => {
      context += `<strong>Question:</strong> ${analysis.questions}<br>`;
      context += `<strong>Response:</strong> ${analysis.response.substring(0, 100)}...<br><br>`;
    });

    return context;
  }

  async saveEnergyAnalysis(question, answer, meterId = 1, maxRecords = 20) {
    try {
      // Check current record count
      const { count } = await supabaseClient
        .from('energy_analyses')
        .select('*', { count: 'exact' });

      // Delete oldest records if over limit
      if (count >= maxRecords) {
        const { data: oldRecords } = await supabaseClient
          .from('energy_analyses')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(count - maxRecords + 1);

        const idsToDelete = oldRecords.map(record => record.id);
        await supabaseClient
          .from('energy_analyses')
          .delete()
          .in('id', idsToDelete);
      }

      // Insert new analysis
      const { data, error } = await supabaseClient
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

  // Method to get recent analyses
  async getRecentAnalyses(limit = 10) {
    try {
      const { data, error } = await supabaseClient
        .from('energy_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error fetching recent analyses:', error);
      throw error;
    }
  }
}

module.exports = { LLMService };