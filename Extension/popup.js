const API_URL = 'https://eat.yunkhngn.dev/api/hom-nay-an-gi';

document.addEventListener('DOMContentLoaded', () => {
    fetchMenu();
    setupTabs();
    document.getElementById('retry-btn')?.addEventListener('click', fetchMenu);
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active classes
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));

            // Add active class to clicked tab and corresponding pane
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            document.getElementById(`tab-${target}`).classList.add('active');
        });
    });
}

async function fetchMenu() {
    showLoading();
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Server error');
        const data = await response.json();
        renderMenu(data);
    } catch (error) {
        showError();
    }
}

function renderMenu(data) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('meal-content').classList.remove('hidden');

    // Header
    document.getElementById('current-date').textContent = data.date_info.date;
    document.getElementById('total-kcal').textContent = data.date_info.total_calories;

    // Breakfast
    const bf = data.meals.breakfast;
    document.getElementById('bf-name').textContent = bf.name;
    document.getElementById('bf-reason').textContent = bf.reason;
    document.getElementById('bf-cal').textContent = `${bf.nutrition.calories} kcal`;

    // Lunch
    const lunch = data.meals.lunch;
    document.getElementById('lunch-name').textContent = lunch.name;
    document.getElementById('lunch-reason').textContent = lunch.reason;
    document.getElementById('lunch-cal').textContent = `${lunch.nutrition.calories} kcal`;

    // Dinner - Render List
    const din = data.meals.dinner;
    const dinnerList = document.getElementById('dinner-list');
    dinnerList.innerHTML = ''; // Clear prev content

    const items = [
        { role: 'Món Mặn', data: din.main },
        { role: 'Canh', data: din.soup },
        { role: 'Rau', data: din.vegetable },
        { role: 'Cơm', data: din.rice },
    ];
    if (din.side) items.push({ role: 'Tráng Miệng/Kèm', data: din.side });

    items.forEach(item => {
        if (!item.data) return;
        const div = document.createElement('div');
        div.className = 'dinner-item';
        div.innerHTML = `
            <div class="d-header">
                <span class="d-name">${item.data.name}</span>
                <span class="d-role">${item.role}</span>
            </div>
            <div class="d-details">
                <p class="d-reason">${item.data.reason || 'Món ngon mỗi ngày'}</p>
                <div class="d-cal">🔥 ${item.data.nutrition?.calories || 0} kcal</div>
            </div>
        `;
        dinnerList.appendChild(div);
    });
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('meal-content').classList.add('hidden');
}

function showError() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error').classList.remove('hidden');
}
