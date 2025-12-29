const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');

// Helper to read data (reads fresh on every request for convenience during dev)
function getData() {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (err) {
        console.error("Error reading data.json:", err.message);
        return [];
    }
}

// Helper to get random item from array
function getRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

// Logic to generate daily plan
function generateDailyPlan(dishes) {
    // Classify dishes
    const breakfastItems = dishes.filter(d => d.type === 'breakfast' || d.type === 'sang');
    const lunchItems = dishes.filter(d => d.type === 'lunch' || d.type === 'trua' || d.type === 'main'); // Lunch can also use main dishes
    const mainItems = dishes.filter(d => d.type === 'main' || d.type === 'man');
    const vegItems = dishes.filter(d => d.type === 'vegetable' || d.type === 'rau');
    const soupItems = dishes.filter(d => d.type === 'soup' || d.type === 'canh');
    const sideItems = dishes.filter(d => d.type === 'side' || d.type === 'kem');

    // Breakfast: Simple
    const breakfast = getRandom(breakfastItems) || { name: "Bánh mì trứng (Default)", type: "breakfast" };

    // Lunch: One big dish (e.g., Bún chả)
    const lunch = getRandom(lunchItems) || { name: "Bún chả (Default)", type: "lunch" };

    // Dinner: Full meal (Meat/Fish, Veg, Soup, Rice)
    const dinnerMain = getRandom(mainItems) || { name: "Thịt rang cháy cạnh (Default)", type: "main" };
    const dinnerVeg = getRandom(vegItems) || { name: "Rau muống luộc (Default)", type: "vegetable" };
    const dinnerSoup = getRandom(soupItems) || { name: "Nước rau luộc dầm sấu (Default)", type: "soup" };
    // Optional side
    const dinnerSide = getRandom(sideItems);

    const dinner = {
        main: dinnerMain,
        vegetable: dinnerVeg,
        soup: dinnerSoup,
        rice: { name: "Cơm trắng", type: "staple" },
        ...(dinnerSide && { side: dinnerSide })
    };

    return {
        breakfast,
        lunch,
        dinner
    };
}

app.get('/api/hom-nay-an-gi', (req, res) => {
    const dishes = getData();
    
    if (dishes.length === 0) {
        // Fallback or warning
        console.warn("Warning: data.json is empty or invalid.");
    }

    const plan = generateDailyPlan(dishes);
    
    res.json({
        date: new Date().toLocaleDateString('vi-VN'),
        plan
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Endpoint: http://localhost:${PORT}/api/hom-nay-an-gi`);
});
