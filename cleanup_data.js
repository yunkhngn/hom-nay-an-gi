const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'Server', 'data.json');

try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    
    let dataset = [];
    if (data.dataset && Array.isArray(data.dataset)) {
        dataset = data.dataset;
    } else if (Array.isArray(data)) {
        dataset = data;
    } else {
        console.error("Unknown data format");
        process.exit(1);
    }

    const initialCount = dataset.length;
    
    // Filter for Vietnamese origin
    // Normalized check: lower case contains 'viet'
    const cleanDataset = dataset.filter(dish => {
        if (!dish.origin) return false;
        return dish.origin.toLowerCase().includes('viet');
    });

    const newData = { dataset: cleanDataset };
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 4), 'utf8');
    
    console.log(`Cleanup complete.`);
    console.log(`Original count: ${initialCount}`);
    console.log(`New count: ${cleanDataset.length}`);
    console.log(`Removed: ${initialCount - cleanDataset.length} items`);

} catch (err) {
    console.error("Error cleaning data:", err);
}
