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
        const data = JSON.parse(raw);
        // Handle if data is wrapped in "dataset" key or is directly an array
        if (data.dataset && Array.isArray(data.dataset)) {
            return data.dataset;
        }
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error("Error reading data.json:", err.message);
        return [];
    }
}

// Simple seeded random generator (Mulberry32)
function splitmix32(a) {
    return function() {
      a |= 0; a = a + 0x9e3779b9 | 0;
      var t = a ^ a >>> 16;
      t = Math.imul(t, 0x21f0aaad);
      t = t ^ t >>> 15;
      t = Math.imul(t, 0x735a2d97);
      return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
    }
}

// Logic to generate daily plan
function generateDailyPlan(dishes) {
    // Generate seed from today's date
    const today = new Date();
    const dateString = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    
    // Create a hash from the date string to use as seed
    let seed = 0;
    for (let i = 0; i < dateString.length; i++) {
        seed = Math.imul(31, seed) + dateString.charCodeAt(i) | 0;
    }
    const rng = splitmix32(seed);

    // Helper: random item from array using seeded rng
    const getRandom = (arr) => {
        if (!arr || arr.length === 0) return null;
        return arr[Math.floor(rng() * arr.length)];
    };

    // Helper to checking meal type (supports array or string)
    const hasType = (dish, type) => {
        if (!dish.meal && !dish.type) return false;
        // Support new schema: "meal": ["breakfast"]
        if (Array.isArray(dish.meal)) return dish.meal.includes(type);
        // Support old/simple schema: "type": "breakfast"
        if (dish.type === type) return true;
        return false;
    };

    // Classify dishes
    const breakfastItems = dishes.filter(d => hasType(d, 'breakfast') || hasType(d, 'sang'));
    // Lunch: Filter out small side dishes/desserts (heuristic: calories > 300 or portion large/medium)
    const lunchItems = dishes.filter(d => (hasType(d, 'lunch') || hasType(d, 'trua') || hasType(d, 'main')) && 
        d.nutrition && d.nutrition.calories > 300);
    
    // Dinner components: relaxed logic to find items if specific tags are missing
    const mainItems = dishes.filter(d => hasType(d, 'main') || hasType(d, 'man') || (hasType(d, 'dinner') && d.nutrition && d.nutrition.calories > 350));
    const vegItems = dishes.filter(d => hasType(d, 'vegetable') || hasType(d, 'rau') || d.name.toLowerCase().startsWith('rau') || d.name.toLowerCase().startsWith('nộm'));
    const soupItems = dishes.filter(d => hasType(d, 'soup') || hasType(d, 'canh') || d.name.toLowerCase().startsWith('canh'));
    const sideItems = dishes.filter(d => hasType(d, 'side') || hasType(d, 'kem'));

    // Rich Default Helper
    const def = (id, name, mealArr, cal, reason, origin) => ({ 
        id, 
        name, 
        meal: mealArr,
        nutrition: { calories: cal, protein: 0, fat: 0, carbs: 0 },
        nutrition_tags: [],
        context_tags: ["default_generated"],
        portion: "medium",
        reason: reason || "Món ăn gợi ý mặc định",
        origin: origin || "viet_nam"
    });

    // Breakfast
    const breakfast = getRandom(breakfastItems) || def("def_bf_1", "Bánh mì trứng (Default)", ["breakfast"], 350, "Bữa sáng nhanh gọn", "viet_nam");

    // Lunch
    const lunch = getRandom(lunchItems) || def("def_lunch_1", "Bún chả (Default)", ["lunch"], 600, "Đặc sản Hà Nội cho bữa trưa", "viet_bac");

    // Dinner components
    const dinnerMain = getRandom(mainItems) || def("def_din_main_1", "Thịt rang cháy cạnh (Default)", ["main"], 500, "Món mặn đưa cơm", "viet_bac");
    const dinnerVeg = getRandom(vegItems) || def("def_din_veg_1", "Rau muống luộc (Default)", ["vegetable"], 50, "Rau xanh thanh mát", "viet_nam");
    const dinnerSoup = getRandom(soupItems) || def("def_din_soup_1", "Nước rau luộc dầm sấu (Default)", ["soup"], 20, "Canh chua giải nhiệt", "viet_bac");
    
    const dinnerRice = { 
        id: "com_trang", 
        name: "Cơm trắng", 
        meal: ["staple"], 
        nutrition: { calories: 200, protein: 4, fat: 0.5, carbs: 45 },
        nutrition_tags: ["carb_source"],
        portion: "bowl",
        reason: "Ăn kèm các món mặn",
        origin: "viet_nam"
    };
    
    // Optional side
    const side = getRandom(sideItems);

    const totalCalories = breakfast.nutrition.calories + lunch.nutrition.calories + 
                          dinnerMain.nutrition.calories + dinnerVeg.nutrition.calories + 
                          dinnerSoup.nutrition.calories + dinnerRice.nutrition.calories;

    const result = {
        date_info: {
            date: dateString,
            total_calories: totalCalories
        },
        meals: {
            breakfast: breakfast,
            lunch: lunch,
            dinner: {
                main: dinnerMain,
                vegetable: dinnerVeg,
                soup: dinnerSoup,
                rice: dinnerRice
            }
        }
    };

    if (side) {
        result.meals.dinner.side = side;
        result.date_info.total_calories += side.nutrition.calories;
    }

    return result;
}

app.get('/api/hom-nay-an-gi', (req, res) => {
    const dishes = getData();
    
    if (dishes.length === 0) {
        // Fallback or warning
        console.warn("Warning: data.json is empty or invalid.");
    }

    const result = generateDailyPlan(dishes);
    
    res.json(result);
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Endpoint: http://localhost:${PORT}/api/hom-nay-an-gi`);
});
