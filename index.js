const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Record = require('./models/Record');

// Environment variables for configuration
const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/evrecord";
const DATA_PASS = process.env.DATA_PASS || 'password';
const ITEMS_PER_PAGE = process.env.ITEMS_PER_PAGE || 10;

// Simple structured logging
const log = {
  info: (message, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`, JSON.stringify(data)),
  error: (message, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, JSON.stringify(error)),
  warn: (message, data = {}) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, JSON.stringify(data))
};

mongoose.connect(MONGODB_URL)
  .then(() => log.info('Database connected successfully'))
  .catch(err => log.error('Database connection failed', err));

const app = express();
app.use(cors());
app.use(express.json({limit: '25mb'}));

app.listen(PORT, () => {
    log.info(`EvRecord server started on port ${PORT}`);
});

// Health check endpoint - Returns server status and basic info
app.get('/', function(req,res) {
  res.json({ 
    status: 'alive', 
    service: 'EvRecord Server',
    version: '1.0.0' 
  });
});

// Configuration endpoint - Returns event recording configuration for the EvRecorder extension
// Used by the browser extension to know what events to capture and how
app.get('/start', (req, res) => {
    log.info('Configuration requested');
    try {
        const configPath = path.join(__dirname, 'configExample.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        const settings = JSON.parse(configData);
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        log.error('Error reading configExample.json', error);
        res.status(500).json({
            success: false,
            message: 'Error loading configuration',
            error: error.message
        });
    }
})

// Helper function to save interaction data to MongoDB  
const importData = async (data) => {
  try {
    await Record.create(data);
    log.info('Record imported successfully', { userId: data.userId, eventCount: data.events && data.events.length });
  } catch (error) {
    log.error('Failed to import record', error);
  }
}

// Data storage endpoint - Receives and stores interaction events from the EvRecorder extension
// Expects: userId (string), events (array with type field required for each event)
// Returns: Success/error status
app.post('/save', (req, res) => {
    let data;
    try {
      data = req.body || {};
      
      // Validate expected structure from dataExample.json
      if (!data.userId || !data.events || !Array.isArray(data.events)) {
        throw new Error('Incorrect data structure: missing userId or events');
      }
      
      // Validate that all events have at least the type field
      const invalidEvents = data.events.filter(event => !event.type);
      if (invalidEvents.length > 0) {
        throw new Error('All events must have a type field');
      }
    } 
    catch (error) {
      log.warn('Invalid record format received', { error: error.message });
      res.status(422).json({
        success: false,
        message: 'Incorrect record format: ' + error.message
      });
      return
    }
    try {
      importData(data);
      res.status(201).json({
        success: true,
        message: 'Record has been processed successfully'
      });
    }
    catch (error) {
      log.error('Error processing data', error);
      res.status(500).json({
        success: false,
        message: 'Error processing data'
      });
    }
});

// Data retrieval endpoint - Returns ALL stored interaction records
// Requires: password in request body for authentication
// Returns: All records with count information
app.get("/fetchall",(req,res) => {
  if (req.body.pass === DATA_PASS) {
    Record.find({}).exec(function(err, data) {
      if (err) {
        log.error('Error fetching all records', err);
        res.status(500).json({
          success: false,
          message: 'Error fetching records'
        });
      } else {
        log.info('All records fetched', { count: data.length });
        res.json({
          success: true,
          data: data,
          count: data.length
        });
      }
    })
  }
  else {
    log.warn('Unauthorized access attempt to fetchall');
    res.status(401).json({
      success: false,
      message: 'Access denied'
    });
  }
})

// Paginated data retrieval endpoint - Returns records in pages for better performance
// Query params: pass (password), page (page number, default: 1), limit (items per page, default: 10)
// Returns: Paginated records with pagination metadata (total items, pages, etc.)
app.get("/fetchpage", async (req, res) => {
  const providedPassword = req.query.pass;

  if (providedPassword !== DATA_PASS) {
    log.warn('Unauthorized access attempt to fetchpage');
    return res.status(401).json({ 
      success: false,
      message: 'Access denied' 
    });
  }

  const page = parseInt(req.query.page) || 1;
  const itemsPerPage = parseInt(req.query.limit) || ITEMS_PER_PAGE;

  try {
    const skip = (page - 1) * itemsPerPage;
    const data = await Record.find({}).skip(skip).limit(itemsPerPage).exec();
    const total = await Record.countDocuments();
    
    log.info('Page fetched', { page, itemsReturned: data.length, total, itemsPerPage });
    
    res.json({
      success: true,
      data: data,
      pagination: {
        page: page,
        itemsPerPage: itemsPerPage,
        totalItems: total,
        totalPages: Math.ceil(total / itemsPerPage)
      }
    });
  } catch (error) {
    log.error('Error querying database', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});
