/* ═══════════════════════════════════════════
   STUDENT EXPENSE MANAGER — script.js
   Complete Frontend Logic
═══════════════════════════════════════════ */

// ══════════════════════════════════════
// CONSTANTS & CONFIG
// ══════════════════════════════════════

const DEFAULT_CATEGORIES = [
    { name: 'Food',         icon: '🍔', color: '#FF6B9D' },
    { name: 'Transport',    icon: '🚌', color: '#3ECFCF' },
    { name: 'Education',    icon: '📚', color: '#6C63FF' },
    { name: 'Fun',          icon: '🎮', color: '#FFB347' },
    { name: 'Rent',         icon: '🏠', color: '#2ECC71' },
    { name: 'Health',       icon: '💊', color: '#E74C3C' },
    { name: 'Shopping',     icon: '👕', color: '#9B59B6' },
    { name: 'Other',        icon: '📦', color: '#95A5A6' },
  ];
  
  const BADGES = [
    { id: 'first_expense',  icon: '🎓', name: 'First Step',     desc: 'Added first expense' },
    { id: 'budget_setter',  icon: '💰', name: 'Goal Setter',    desc: 'Set a savings goal' },
    { id: 'streak_7',       icon: '🔥', name: 'On Fire',        desc: '7 day streak' },
    { id: 'saver_week',     icon: '🏆', name: 'Saver',          desc: 'Saved all week' },
    { id: 'budget_master',  icon: '👑', name: 'Budget Master',  desc: 'Stayed under budget' },
    { id: 'data_nerd',      icon: '📊', name: 'Data Nerd',      desc: '30 days in a row' },
    { id: 'all_rounder',    icon: '🚀', name: 'All Rounder',    desc: 'Used all categories' },
    { id: 'zero_waste',     icon: '💎', name: 'Zero Waste',     desc: 'Mindful spender' },
  ];
  
  const QUOTES = [
    "Do not save what is left after spending, spend what is left after saving.",
    "A budget is telling your money where to go instead of wondering where it went.",
    "Beware of little expenses; a small leak will sink a great ship.",
    "It is not your salary that makes you rich, it is your spending habits.",
    "Financial freedom is available to those who learn about it and work for it.",
    "The secret to wealth is simple: spend less than you earn.",
    "Every dollar you save today is a dollar working for your future.",
    "Rich people stay rich by living like they are broke. Broke people stay broke by living like they are rich.",
    "An investment in knowledge pays the best interest.",
    "Track every penny — small amounts add up to big differences.",
  ];
  
  const CHART_COLORS = ['#6C63FF','#3ECFCF','#FF6B9D','#FFB347','#2ECC71','#E74C3C','#9B59B6','#F39C12','#1ABC9C','#E67E22'];
  
  // ══════════════════════════════════════
  // STATE
  // ══════════════════════════════════════
  let currentUser = null;        // logged-in user email or 'guest'
  let profile = {};              // current user's profile
  let expenses = [];             // current month expenses
  let incomes = [];              // current month incomes
  let badges = {};               // earned badges
  let archive = {};              // past months
  let setupPin = '';             // pin being entered during setup
  let pinEntry = '';             // pin entry on lock screen
  let selectedCategory = 'Food';
  let selectedSource = 'Pocket Money';
  let selectedCurrency = 'Rs';
  let selectedAvatar = '🎓';
  let isEditingExpense = false;
  let historyFilter = 'All';
  let historySortNewest = true;
  let currentPeriod = 'month';
  let calendarDate = new Date();
  let confirmCallback = null;
  let amountsHidden = false;
  let currentHistoryTab = 'expenses';
  
  // ══════════════════════════════════════
  // INIT
  // ══════════════════════════════════════
  window.addEventListener('DOMContentLoaded', () => {
    // Show splash, then init
    setTimeout(() => {
      initApp();
    }, 2000);
  });
  
  function initApp() {
    checkMonthlyReset();
  
    const loggedIn = localStorage.getItem('sxp_current_user');
    if (loggedIn) {
      currentUser = loggedIn;
      loadUserData();
      const p = getProfile();
      if (p.pin) {
        showScreen('pin');
        setupPINScreen(p);
      } else {
        launchApp();
      }
    } else {
      showScreen('welcome');
    }
  }
  
  // ══════════════════════════════════════
  // SCREENS
  // ══════════════════════════════════════
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + name).classList.add('active');
  }
  
  // ══════════════════════════════════════
  // AUTH
  // ══════════════════════════════════════
  function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="switchAuthTab('${tab}')"]`).classList.add('active');
    document.getElementById('auth-' + tab).classList.add('active');
  }
  
  function handleLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pw = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';
  
    if (!email || !pw) { errEl.textContent = 'Please fill in all fields.'; return; }
  
    const accounts = getAccounts();
    const user = accounts.find(a => a.email === email);
    if (!user) { errEl.textContent = 'No account found with this email.'; return; }
    if (user.password !== btoa(pw)) { errEl.textContent = 'Incorrect password.'; return; }
  
    currentUser = email;
    localStorage.setItem('sxp_current_user', email);
    loadUserData();
  
    const p = getProfile();
    if (p.pin) {
      showScreen('pin');
      setupPINScreen(p);
    } else if (!p.setupDone) {
      showScreen('setup');
      initSetup();
    } else {
      launchApp();
    }
  }
  
  function handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const pw = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const errEl = document.getElementById('signup-error');
    errEl.textContent = '';
  
    if (!name || !email || !pw || !confirm) { errEl.textContent = 'Please fill in all fields.'; return; }
    if (!email.includes('@')) { errEl.textContent = 'Enter a valid email.'; return; }
    if (pw.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }
    if (pw !== confirm) { errEl.textContent = 'Passwords do not match.'; return; }
  
    const accounts = getAccounts();
    if (accounts.find(a => a.email === email)) { errEl.textContent = 'Email already registered.'; return; }
  
    accounts.push({ email, password: btoa(pw), name });
    localStorage.setItem('sxp_accounts', JSON.stringify(accounts));
  
    currentUser = email;
    localStorage.setItem('sxp_current_user', email);
  
    // Initialize fresh profile
    profile = { name, email, avatar: '🎓', budget: 0, currency: 'Rs', savingsGoal: 0, setupDone: false, categoryBudgets: {}, customCategories: [] };
    saveProfile();
    expenses = []; saveExpenses();
    incomes = []; saveIncomes();
    badges = {}; saveBadges();
  
    showScreen('setup');
    initSetup();
  }
  
  function continueAsGuest() {
    currentUser = 'guest';
    loadUserData();
    if (!profile.setupDone) {
      profile = { name: 'Guest', avatar: '🎓', budget: 0, currency: 'Rs', savingsGoal: 0, setupDone: false, categoryBudgets: {}, customCategories: [] };
      saveProfile();
      showScreen('setup');
      initSetup();
    } else {
      launchApp();
    }
  }
  
  function logout() {
    localStorage.removeItem('sxp_current_user');
    currentUser = null;
    profile = {}; expenses = []; incomes = []; badges = {};
    showScreen('welcome');
    document.getElementById('screen-app').classList.remove('active');
  }
  
  function getAccounts() {
    try { return JSON.parse(localStorage.getItem('sxp_accounts')) || []; }
    catch { return []; }
  }
  
  // ══════════════════════════════════════
  // PIN LOCK SCREEN
  // ══════════════════════════════════════
  function setupPINScreen(p) {
    document.getElementById('pin-avatar').textContent = p.avatar || '🎓';
    document.getElementById('pin-greeting').textContent = getGreeting();
    document.getElementById('pin-username').textContent = p.name || '';
    pinEntry = '';
    updatePINDots(pinEntry, 'dot');
  }
  
  function pinInput(d) {
    if (pinEntry.length >= 4) return;
    pinEntry += d;
    updatePINDots(pinEntry, 'dot');
    if (pinEntry.length === 4) {
      setTimeout(() => verifyPIN(), 100);
    }
  }
  function pinDelete() { pinEntry = pinEntry.slice(0, -1); updatePINDots(pinEntry, 'dot'); }
  function pinClear() { pinEntry = ''; updatePINDots(pinEntry, 'dot'); }
  
  function verifyPIN() {
    const p = getProfile();
    if (pinEntry === p.pin) {
      launchApp();
    } else {
      document.getElementById('pin-error').textContent = 'Incorrect PIN. Try again.';
      document.querySelector('.pin-content').classList.add('pin-error-shake');
      setTimeout(() => {
        document.querySelector('.pin-content').classList.remove('pin-error-shake');
        pinEntry = '';
        updatePINDots(pinEntry, 'dot');
      }, 500);
    }
  }
  
  function updatePINDots(entry, prefix) {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(prefix + '-' + i);
      if (dot) dot.classList.toggle('filled', i < entry.length);
    }
  }
  
  // ══════════════════════════════════════
  // SETUP WIZARD
  // ══════════════════════════════════════
  function initSetup() {
    setupPin = '';
    selectedAvatar = profile.avatar || '🎓';
    selectedCurrency = profile.currency || 'Rs';
    // pre-select avatar
    document.querySelectorAll('.emoji-opt').forEach(e => {
      e.classList.toggle('selected', e.textContent === selectedAvatar);
    });
    setupNext(1);
  }
  
  function setupNext(step) {
    if (step === 2) {
      // Validate nothing for step 1 (avatar optional)
    }
    if (step === 3) {
      const budgetVal = document.getElementById('setup-budget').value;
      if (!budgetVal || parseFloat(budgetVal) <= 0) {
        showToast('Please enter a valid budget', 'error'); return;
      }
      profile.budget = parseFloat(budgetVal);
      profile.savingsGoal = parseFloat(document.getElementById('setup-savings').value) || 0;
      profile.currency = selectedCurrency;
      profile.avatar = selectedAvatar;
    }
    document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('active'));
    document.getElementById('setup-step-' + step).classList.add('active');
    document.querySelectorAll('.step').forEach((s, i) => {
      s.classList.toggle('active', i + 1 === step);
    });
  }
  
  function selectAvatar(el, emoji) {
    document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    selectedAvatar = emoji;
    profile.avatar = emoji;
  }
  
  function selectCurrency(el, cur) {
    document.querySelectorAll('.currency-opt').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
    selectedCurrency = cur;
  }
  
  function setupPinInput(d) {
    if (setupPin.length >= 4) return;
    setupPin += d;
    updatePINDots(setupPin, 'sdot');
  }
  function setupPinDelete() { setupPin = setupPin.slice(0, -1); updatePINDots(setupPin, 'sdot'); }
  function setupPinClear() { setupPin = ''; updatePINDots(setupPin, 'sdot'); }
  
  function finishSetup() {
    if (setupPin.length === 4) profile.pin = setupPin;
    profile.setupDone = true;
    saveProfile();
    launchApp();
  }
  
  // ══════════════════════════════════════
  // LAUNCH APP
  // ══════════════════════════════════════
  function launchApp() {
    loadUserData();
    showScreen('app');
    if (currentUser === 'guest') {
      document.getElementById('guest-banner').classList.remove('hidden');
    }
    renderHeader();
    renderDashboard();
    buildCategoryGrid();
    buildFilterChips();
    buildSettingsForm();
    setTodayDate();
    showDailyQuote();
    checkAlerts();
    switchTab('dashboard');
  }
  
  // ══════════════════════════════════════
  // DATA LAYER
  // ══════════════════════════════════════
  function key(suffix) { return 'sxp_' + currentUser + '_' + suffix; }
  
  function saveProfile() { localStorage.setItem(key('profile'), JSON.stringify(profile)); }
  function getProfile() {
    try { return JSON.parse(localStorage.getItem(key('profile'))) || {}; }
    catch { return {}; }
  }
  function loadProfile() { profile = getProfile(); }
  
  function saveExpenses() { localStorage.setItem(key('expenses'), JSON.stringify(expenses)); }
  function loadExpenses() {
    try { expenses = JSON.parse(localStorage.getItem(key('expenses'))) || []; }
    catch { expenses = []; }
  }
  
  function saveIncomes() { localStorage.setItem(key('incomes'), JSON.stringify(incomes)); }
  function loadIncomes() {
    try { incomes = JSON.parse(localStorage.getItem(key('incomes'))) || []; }
    catch { incomes = []; }
  }
  
  function saveBadges() { localStorage.setItem(key('badges'), JSON.stringify(badges)); }
  function loadBadges() {
    try { badges = JSON.parse(localStorage.getItem(key('badges'))) || {}; }
    catch { badges = {}; }
  }
  
  function saveArchive() { localStorage.setItem(key('archive'), JSON.stringify(archive)); }
  function loadArchive() {
    try { archive = JSON.parse(localStorage.getItem(key('archive'))) || {}; }
    catch { archive = {}; }
  }
  
  function loadUserData() {
    loadProfile();
    loadExpenses();
    loadIncomes();
    loadBadges();
    loadArchive();
  }
  
  function generateID() { return Date.now() + Math.floor(Math.random() * 1000); }
  
  // ══════════════════════════════════════
  // MONTHLY RESET
  // ══════════════════════════════════════
  function checkMonthlyReset() {
    if (!currentUser) return;
    const p = getProfile();
    const currentMonth = getCurrentMonth();
    if (p.lastResetMonth && p.lastResetMonth !== currentMonth) {
      // Archive last month
      loadExpenses(); loadIncomes();
      const lastMonth = p.lastResetMonth;
      if (!archive[lastMonth]) {
        archive[lastMonth] = { expenses: [...expenses], incomes: [...incomes], budget: p.budget };
        saveArchive();
      }
      // Reset
      expenses = []; saveExpenses();
      incomes = []; saveIncomes();
    }
    p.lastResetMonth = currentMonth;
    profile = p;
    saveProfile();
  }
  
  function getCurrentMonth() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  
  // ══════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════
  function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    const navBtn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
    if (navBtn) navBtn.classList.add('active');
  
    // Render on switch
    if (tab === 'dashboard') renderDashboard();
    if (tab === 'history') { buildFilterChips(); renderHistory(); renderIncomeList(); }
    if (tab === 'stats') renderStats();
    if (tab === 'calendar') renderCalendar();
    if (tab === 'settings') buildSettingsForm();
    if (tab === 'add') {
      if (!isEditingExpense) resetExpenseForm();
      setTodayDate();
    }
  }
  
  // ══════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════
  function renderDashboard() {
    loadUserData();
    const cur = profile.currency || 'Rs';
    const budget = profile.budget || 0;
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const balance = budget + totalIncome - totalSpent;
    const pct = budget > 0 ? Math.min((totalSpent / (budget + totalIncome)) * 100, 100) : 0;
  
    setText('dash-budget', formatCurrency(budget, cur));
    setText('dash-income', formatCurrency(totalIncome, cur));
    setText('dash-spent', formatCurrency(totalSpent, cur));
    setText('dash-balance', formatCurrency(balance, cur));
    setText('progress-pct', Math.round(pct) + '%');
  
    const fill = document.getElementById('progress-fill');
    fill.style.width = pct + '%';
    fill.classList.remove('warning', 'danger');
    if (pct >= 90) fill.classList.add('danger');
    else if (pct >= 70) fill.classList.add('warning');
  
    // Status message
    let status = '✅ You are doing great! Keep it up.';
    if (pct >= 90) status = '🚨 Critical! Almost out of budget.';
    else if (pct >= 70) status = '⚠️ Warning! Watch your spending.';
    else if (budget === 0) status = 'Set your budget in Settings to get started!';
    setText('budget-status', status);
  
    // Score
    const score = calcSpendingScore(pct);
    setText('score-value', score);
    const sc = document.getElementById('score-circle');
    sc.classList.remove('good', 'ok', 'bad');
    if (score >= 80) sc.classList.add('good');
    else if (score >= 50) sc.classList.add('ok');
    else sc.classList.add('bad');
  
    // Streak
    setText('streak-value', calcStreak());
  
    // Daily avg
    const daysGone = getDaysPassedInMonth();
    const avg = daysGone > 0 ? totalSpent / daysGone : 0;
    setText('daily-avg', formatCurrency(Math.round(avg), cur));
  
    // Savings goal
    const goal = profile.savingsGoal || 0;
    if (goal > 0) {
      const saved = Math.max(0, balance);
      const goalPct = Math.min((saved / goal) * 100, 100);
      setText('savings-progress-text', formatCurrency(Math.round(saved), cur) + ' / ' + formatCurrency(goal, cur));
      document.getElementById('savings-fill').style.width = goalPct + '%';
      document.getElementById('savings-card').classList.remove('hidden');
    } else {
      document.getElementById('savings-card').classList.add('hidden');
    }
  
    // Forecast
    const remainingDays = getDaysInMonth() - getDaysPassedInMonth();
    const forecastCard = document.getElementById('forecast-card');
    if (avg > 0 && balance > 0) {
      const daysLeft = Math.floor(balance / avg);
      if (daysLeft < remainingDays - 2) {
        setText('forecast-text', `⚠️ At this rate, budget runs out in ~${daysLeft} day${daysLeft !== 1 ? 's' : ''}!`);
        forecastCard.classList.remove('hidden');
      } else {
        forecastCard.classList.add('hidden');
      }
    } else {
      forecastCard.classList.add('hidden');
    }
  
    // Header
    renderHeader();
  
    // Badges
    calcBadges();
    renderBadgesRow();
  
    // Recent expenses
    renderRecentExpenses();
  }
  
  function renderHeader() {
    const p = profile;
    setText('header-avatar', p.avatar || '🎓');
    setText('header-greeting', getGreeting());
    setText('header-name', (p.name || 'User').split(' ')[0]);
  }
  
  function renderRecentExpenses() {
    const container = document.getElementById('recent-list');
    const recent = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    if (recent.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-emoji">📭</div><p>No expenses yet. Add your first one!</p></div>`;
      return;
    }
    container.innerHTML = recent.map(e => buildExpenseCard(e, false)).join('');
  }
  
  function renderBadgesRow() {
    const container = document.getElementById('badges-row');
    container.innerHTML = BADGES.map(b => `
      <div class="badge-item ${badges[b.id] ? 'earned' : 'locked'}" title="${b.desc}">
        <div class="badge-icon">${b.icon}</div>
        <span class="badge-name">${b.name}</span>
      </div>
    `).join('');
  }
  
  // ══════════════════════════════════════
  // ADD / EDIT EXPENSE
  // ══════════════════════════════════════
  function openAddExpense() {
    isEditingExpense = false;
    resetExpenseForm();
    document.getElementById('income-form-section').style.display = 'none';
    document.getElementById('expense-submit-btn').style.display = 'flex';
    switchTab('add');
  }
  
  function openAddIncome() {
    document.getElementById('income-form-section').style.display = 'flex';
    document.getElementById('income-date').value = todayString();
    switchTab('add');
  }
  
  function closeAddIncome() {
    document.getElementById('income-form-section').style.display = 'none';
  }
  
  function buildCategoryGrid() {
    const grid = document.getElementById('category-grid');
    const allCats = getAllCategories();
    grid.innerHTML = allCats.map(c => `
      <button class="cat-btn ${c.name === selectedCategory ? 'selected' : ''}"
        onclick="selectCat(this, '${c.name}')">
        <span class="cat-icon">${c.icon}</span>
        <span>${c.name}</span>
      </button>
    `).join('');
  }
  
  function selectCat(el, name) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    selectedCategory = name;
  }
  
  function selectSource(el) {
    document.querySelectorAll('.source-opt').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    selectedSource = el.dataset.source;
  }
  
  function setTodayDate() {
    const today = todayString();
    const expDate = document.getElementById('expense-date');
    const incDate = document.getElementById('income-date');
    if (expDate && !expDate.value) expDate.value = today;
    if (incDate) incDate.value = today;
  }
  
  function todayString() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  
  function resetExpenseForm() {
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-date').value = todayString();
    document.getElementById('expense-note').value = '';
    document.getElementById('edit-expense-id').value = '';
    document.getElementById('expense-submit-btn').textContent = '';
    document.getElementById('expense-submit-btn').innerHTML = '<i class="fa fa-check"></i> Add Expense';
    document.getElementById('expense-cancel-btn').style.display = 'none';
    setText('add-form-title', 'Add Expense');
    setText('add-form-subtitle', 'Track where your money goes');
    selectedCategory = 'Food';
    isEditingExpense = false;
    buildCategoryGrid();
    setText('form-currency', profile.currency || 'Rs');
  }
  
  function submitExpense() {
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value || todayString();
    const note = document.getElementById('expense-note').value.trim();
    const editId = document.getElementById('edit-expense-id').value;
  
    if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
  
    const cat = getAllCategories().find(c => c.name === selectedCategory) || DEFAULT_CATEGORIES[0];
    const expObj = {
      id: editId ? parseInt(editId) : generateID(),
      amount, category: cat.name, icon: cat.icon,
      date, note, month: date.substring(0, 7)
    };
  
    if (editId) {
      const idx = expenses.findIndex(e => e.id === parseInt(editId));
      if (idx > -1) expenses[idx] = expObj;
      showToast('Expense updated! ✏️', 'success');
    } else {
      expenses.push(expObj);
      showToast('Expense added! ✅', 'success');
    }
  
    saveExpenses();
    calcBadges();
    saveBadges();
    resetExpenseForm();
    renderDashboard();
    checkAlerts();
  }
  
  function editExpense(id) {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;
    isEditingExpense = true;
    selectedCategory = exp.category;
    buildCategoryGrid();
    document.getElementById('expense-amount').value = exp.amount;
    document.getElementById('expense-date').value = exp.date;
    document.getElementById('expense-note').value = exp.note || '';
    document.getElementById('edit-expense-id').value = exp.id;
    document.getElementById('expense-submit-btn').innerHTML = '<i class="fa fa-save"></i> Save Changes';
    document.getElementById('expense-cancel-btn').style.display = 'flex';
    setText('add-form-title', 'Edit Expense');
    setText('add-form-subtitle', 'Make your changes below');
    switchTab('add');
  }
  
  function cancelEdit() { resetExpenseForm(); }
  
  async function deleteExpense(id) {
    const ok = await confirmDialog('Delete this expense?');
    if (!ok) return;
    expenses = expenses.filter(e => e.id !== id);
    saveExpenses();
    showToast('Expense deleted', 'warning');
    renderDashboard();
    renderHistory();
    renderStats();
  }
  
  function submitIncome() {
    const amount = parseFloat(document.getElementById('income-amount').value);
    const date = document.getElementById('income-date').value || todayString();
    const note = document.getElementById('income-note').value.trim();
    if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
  
    incomes.push({ id: generateID(), amount, source: selectedSource, date, note, month: date.substring(0,7) });
    saveIncomes();
    showToast('Income added! 💰', 'success');
    document.getElementById('income-amount').value = '';
    document.getElementById('income-note').value = '';
    closeAddIncome();
    renderDashboard();
  }
  
  async function deleteIncome(id) {
    const ok = await confirmDialog('Delete this income entry?');
    if (!ok) return;
    incomes = incomes.filter(i => i.id !== id);
    saveIncomes();
    showToast('Deleted', 'warning');
    renderIncomeList();
    renderDashboard();
  }
  
  // ══════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════
  function switchHistoryTab(tab, el) {
    currentHistoryTab = tab;
    document.querySelectorAll('.htab').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('history-list').style.display = tab === 'expenses' ? 'flex' : 'none';
    document.getElementById('income-list').style.display = tab === 'income' ? 'flex' : 'none';
    if (tab === 'expenses') renderHistory();
    else renderIncomeList();
  }
  
  function buildFilterChips() {
    const container = document.getElementById('filter-chips');
    const allCats = getAllCategories();
    const chips = ['All', ...allCats.map(c => c.name)];
    container.innerHTML = chips.map(c => `
      <button class="filter-chip ${historyFilter === c ? 'active' : ''}"
        onclick="setFilter('${c}')">${c === 'All' ? '🔍 All' : (allCats.find(x=>x.name===c)?.icon||'') + ' ' + c}</button>
    `).join('');
  }
  
  function setFilter(cat) {
    historyFilter = cat;
    buildFilterChips();
    renderHistory();
  }
  
  function toggleSort() {
    historySortNewest = !historySortNewest;
    renderHistory();
  }
  
  function renderHistory() {
    const container = document.getElementById('history-list');
    const search = (document.getElementById('history-search')?.value || '').toLowerCase();
    let list = [...expenses];
    if (historyFilter !== 'All') list = list.filter(e => e.category === historyFilter);
    if (search) list = list.filter(e => e.category.toLowerCase().includes(search) || (e.note||'').toLowerCase().includes(search));
    list.sort((a, b) => historySortNewest ? new Date(b.date)-new Date(a.date) : new Date(a.date)-new Date(b.date));
  
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-emoji">📭</div><p>No expenses found.</p></div>`;
      return;
    }
    container.innerHTML = list.map(e => buildExpenseCard(e, true)).join('');
  }
  
  function renderIncomeList() {
    const container = document.getElementById('income-list');
    if (!container) return;
    const list = [...incomes].sort((a,b) => new Date(b.date)-new Date(a.date));
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-emoji">💸</div><p>No income recorded yet.</p></div>`;
      return;
    }
    container.innerHTML = list.map(i => `
      <div class="expense-item">
        <div class="expense-icon">💰</div>
        <div class="expense-info">
          <div class="expense-category">${i.source}</div>
          <div class="expense-meta">
            <span>${formatDate(i.date)}</span>
            ${i.note ? `<span>${i.note}</span>` : ''}
          </div>
        </div>
        <span class="expense-amount income-amount amount-field">+${formatCurrency(i.amount, profile.currency)}</span>
        <div class="expense-actions">
          <button class="action-icon-btn delete-btn" onclick="deleteIncome(${i.id})"><i class="fa fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  }
  
  function buildExpenseCard(e, showActions) {
    return `
      <div class="expense-item">
        <div class="expense-icon">${e.icon}</div>
        <div class="expense-info">
          <div class="expense-category">${e.category}</div>
          <div class="expense-meta">
            <span>${formatDate(e.date)}</span>
            ${e.note ? `<span>${e.note}</span>` : ''}
          </div>
        </div>
        <span class="expense-amount amount-field">${formatCurrency(e.amount, profile.currency)}</span>
        ${showActions ? `
        <div class="expense-actions">
          <button class="action-icon-btn edit-btn" onclick="editExpense(${e.id})"><i class="fa fa-pencil"></i></button>
          <button class="action-icon-btn delete-btn" onclick="deleteExpense(${e.id})"><i class="fa fa-trash"></i></button>
        </div>` : ''}
      </div>
    `;
  }
  
  // ══════════════════════════════════════
  // STATS
  // ══════════════════════════════════════
  function switchPeriod(period, el) {
    currentPeriod = period;
    document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    renderStats();
  }
  
  function renderStats() {
    const cur = profile.currency || 'Rs';
    let list = getExpensesForPeriod(currentPeriod);
  
    // Summary
    const total = list.reduce((s, e) => s + e.amount, 0);
    const days = getPeriodDays(currentPeriod);
    const avg = days > 0 ? total / days : 0;
    setText('stat-total', formatCurrency(Math.round(total), cur));
    setText('stat-avg', formatCurrency(Math.round(avg), cur));
    setText('stat-count', list.length);
  
    // Biggest spending day
    const byDay = {};
    list.forEach(e => { byDay[e.date] = (byDay[e.date] || 0) + e.amount; });
    const bigDay = Object.entries(byDay).sort((a,b) => b[1]-a[1])[0];
    if (bigDay) {
      setText('biggest-day-val', formatDate(bigDay[0]) + ' — ' + formatCurrency(Math.round(bigDay[1]), cur));
    } else {
      setText('biggest-day-val', 'No data yet');
    }
  
    // Weekly comparison
    const thisWeekExp = getWeekExpenses(0);
    const lastWeekExp = getWeekExpenses(1);
    const thisTotal = thisWeekExp.reduce((s,e) => s+e.amount, 0);
    const lastTotal = lastWeekExp.reduce((s,e) => s+e.amount, 0);
    setText('val-this-week', formatCurrency(Math.round(thisTotal), cur));
    setText('val-last-week', formatCurrency(Math.round(lastTotal), cur));
    const maxW = Math.max(thisTotal, lastTotal, 1);
    document.getElementById('bar-this-week').style.height = (thisTotal/maxW*100) + '%';
    document.getElementById('bar-last-week').style.height = (lastTotal/maxW*100) + '%';
  
    // Category chart
    renderCategoryChart(list, cur);
  
    // Category alerts
    renderCategoryAlerts(cur);
  }
  
  function renderCategoryChart(list, cur) {
    const container = document.getElementById('category-chart');
    const allCats = getAllCategories();
    const catTotals = {};
    list.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const max = Math.max(...Object.values(catTotals), 1);
    const sorted = Object.entries(catTotals).sort((a,b) => b[1]-a[1]);
  
    if (sorted.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-emoji">📊</div><p>No data for this period</p></div>`;
      return;
    }
  
    container.innerHTML = sorted.map(([name, val], i) => {
      const cat = allCats.find(c => c.name === name) || { icon: '📦', color: CHART_COLORS[i % CHART_COLORS.length] };
      const pct = (val / max) * 100;
      return `
        <div class="chart-row">
          <span class="chart-label">${cat.icon}</span>
          <span class="chart-name">${name}</span>
          <div class="chart-bar-wrap">
            <div class="chart-bar-inner" style="width:${pct}%;background:${cat.color || CHART_COLORS[i%CHART_COLORS.length]}"></div>
          </div>
          <span class="chart-amount amount-field">${formatCurrency(Math.round(val), cur)}</span>
        </div>
      `;
    }).join('');
  }
  
  function renderCategoryAlerts(cur) {
    const container = document.getElementById('category-alerts');
    const catBudgets = profile.categoryBudgets || {};
    const alerts = [];
    const allCats = getAllCategories();
    allCats.forEach(c => {
      if (catBudgets[c.name]) {
        const spent = expenses.filter(e => e.category === c.name).reduce((s,e) => s+e.amount, 0);
        if (spent > catBudgets[c.name]) {
          alerts.push(`<div class="cat-alert"><i class="fa fa-exclamation-circle"></i> ${c.icon} ${c.name} is over budget! Spent ${formatCurrency(Math.round(spent), cur)}, limit ${formatCurrency(catBudgets[c.name], cur)}</div>`);
        }
      }
    });
    container.innerHTML = alerts.join('');
  }
  
  function getExpensesForPeriod(period) {
    const now = new Date();
    if (period === 'month') return expenses;
    if (period === 'week') return getWeekExpenses(0);
    return expenses; // all time = current month only in this version
  }
  
  function getWeekExpenses(weeksAgo) {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7) - weeksAgo * 7);
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= monday && d <= sunday;
    });
  }
  
  function getPeriodDays(period) {
    if (period === 'month') return getDaysPassedInMonth();
    if (period === 'week') return 7;
    return getDaysPassedInMonth();
  }
  
  // ══════════════════════════════════════
  // CALENDAR
  // ══════════════════════════════════════
  function changeCalMonth(dir) {
    calendarDate.setMonth(calendarDate.getMonth() + dir);
    renderCalendar();
  }
  
  function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthStr = year + '-' + String(month+1).padStart(2,'0');
    const monthName = calendarDate.toLocaleString('default', { month: 'long' });
    setText('cal-month-label', monthName + ' ' + year);
  
    const grid = document.getElementById('calendar-grid');
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  
    // Build day totals
    const dayTotals = {};
    const monthExpenses = expenses.filter(e => e.date.startsWith(monthStr));
    monthExpenses.forEach(e => { dayTotals[e.date] = (dayTotals[e.date] || 0) + e.amount; });
  
    const avgDaily = Object.keys(dayTotals).length > 0
      ? Object.values(dayTotals).reduce((a,b) => a+b, 0) / Object.keys(dayTotals).length : 0;
  
    const firstDay = new Date(year, month, 1).getDay();
    const offset = (firstDay + 6) % 7; // Monday start
    const totalDays = new Date(year, month+1, 0).getDate();
    const today = new Date();
    const todayStr = todayString();
  
    let html = days.map(d => `<div class="cal-day-label">${d}</div>`).join('');
    for (let i = 0; i < offset; i++) html += `<div class="cal-day empty"></div>`;
  
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      const total = dayTotals[dateStr] || 0;
      let cls = '';
      if (total > 0) {
        if (total < avgDaily * 0.7) cls = 'has-low';
        else if (total < avgDaily * 1.3) cls = 'has-mid';
        else cls = 'has-high';
      }
      const isToday = dateStr === todayStr ? 'today' : '';
      html += `
        <div class="cal-day ${cls} ${isToday}" onclick="showDayPopup('${dateStr}')">
          ${d}
          ${total > 0 ? '<span class="cal-dot"></span>' : ''}
        </div>
      `;
    }
    grid.innerHTML = html;
  }
  
  function showDayPopup(dateStr) {
    const popup = document.getElementById('day-popup');
    const d = new Date(dateStr + 'T00:00:00');
    const label = d.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long' });
    setText('day-popup-title', label);
  
    const dayExpenses = expenses.filter(e => e.date === dateStr);
    const container = document.getElementById('day-popup-list');
    if (dayExpenses.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:1rem">No expenses on this day.</p>`;
    } else {
      container.innerHTML = dayExpenses.map(e => buildExpenseCard(e, false)).join('');
      const total = dayExpenses.reduce((s, e) => s+e.amount, 0);
      container.innerHTML += `<div style="text-align:right;font-weight:700;padding:0.5rem 0;border-top:1px solid var(--card-border);margin-top:0.5rem">Total: ${formatCurrency(total, profile.currency)}</div>`;
    }
    popup.classList.remove('hidden');
  }
  
  function closeDayPopup() {
    document.getElementById('day-popup').classList.add('hidden');
  }
  
  // ══════════════════════════════════════
  // SETTINGS
  // ══════════════════════════════════════
  function buildSettingsForm() {
    const p = profile;
    const nameEl = document.getElementById('settings-name');
    const curEl = document.getElementById('settings-currency');
    const budEl = document.getElementById('settings-budget');
    const savEl = document.getElementById('settings-savings');
    if (nameEl) nameEl.value = p.name || '';
    if (curEl) curEl.value = p.currency || 'Rs';
    if (budEl) budEl.value = p.budget || '';
    if (savEl) savEl.value = p.savingsGoal || '';
  
    // PIN toggle
    const pinToggle = document.getElementById('pin-toggle');
    if (pinToggle) pinToggle.checked = !!p.pin;
  
    // Avatar mini grid
    const avatarGrid = document.getElementById('settings-avatar-grid');
    if (avatarGrid) {
      const emojis = ['🎓','👨‍💻','👩‍💻','🧑‍🎨','👨‍🔬','👩‍🔬','🧑‍💼','🦸','🧙','🐱','🦊','🎯'];
      avatarGrid.innerHTML = emojis.map(e => `
        <span class="mini-emoji-opt ${e === p.avatar ? 'selected' : ''}"
          onclick="setSettingsAvatar(this,'${e}')">${e}</span>
      `).join('');
    }
  
    // Custom categories
    renderCustomCats();
  
    // Category budgets
    renderCatBudgets();
  
    // Monthly history
    renderMonthlyHistory();
  }
  
  function setSettingsAvatar(el, emoji) {
    document.querySelectorAll('.mini-emoji-opt').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    profile.avatar = emoji;
  }
  
  function saveSettings() {
    const name = document.getElementById('settings-name').value.trim();
    const cur = document.getElementById('settings-currency').value;
    const budget = parseFloat(document.getElementById('settings-budget').value) || 0;
    const savings = parseFloat(document.getElementById('settings-savings').value) || 0;
    if (!name) { showToast('Name cannot be empty', 'error'); return; }
    profile.name = name;
    profile.currency = cur;
    profile.budget = budget;
    profile.savingsGoal = savings;
    saveProfile();
    renderHeader();
    renderDashboard();
    buildCategoryGrid();
    showToast('Settings saved! ✅', 'success');
  }
  
  function updateProfile() { saveSettings(); }
  
  function togglePINSetting(el) {
    document.getElementById('pin-change-section').style.display = el.checked ? 'flex' : 'none';
    if (!el.checked) {
      profile.pin = null;
      saveProfile();
      showToast('PIN removed', 'warning');
    }
  }
  
  function savePIN() {
    const pin = document.getElementById('new-pin').value;
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      showToast('Enter a valid 4-digit PIN', 'error'); return;
    }
    profile.pin = pin;
    saveProfile();
    showToast('PIN set! 🔒', 'success');
    document.getElementById('pin-change-section').style.display = 'none';
  }
  
  function addCustomCategory() {
    const name = document.getElementById('new-cat-name').value.trim();
    const icon = document.getElementById('new-cat-icon').value.trim() || '🏷️';
    if (!name) { showToast('Enter a category name', 'error'); return; }
    if (!profile.customCategories) profile.customCategories = [];
    if (profile.customCategories.find(c => c.name === name)) {
      showToast('Category already exists', 'error'); return;
    }
    profile.customCategories.push({ name, icon });
    saveProfile();
    document.getElementById('new-cat-name').value = '';
    document.getElementById('new-cat-icon').value = '';
    renderCustomCats();
    buildCategoryGrid();
    buildFilterChips();
    showToast('Category added! ✅', 'success');
  }
  
  function removeCustomCategory(name) {
    profile.customCategories = (profile.customCategories || []).filter(c => c.name !== name);
    saveProfile();
    renderCustomCats();
    buildCategoryGrid();
    buildFilterChips();
  }
  
  function renderCustomCats() {
    const container = document.getElementById('custom-cats-list');
    if (!container) return;
    const cats = profile.customCategories || [];
    if (cats.length === 0) {
      container.innerHTML = `<p style="font-size:0.85rem;color:var(--text-muted)">No custom categories yet.</p>`;
      return;
    }
    container.innerHTML = cats.map(c => `
      <div class="custom-cat-item">
        <span>${c.icon} ${c.name}</span>
        <button class="action-icon-btn delete-btn" onclick="removeCustomCategory('${c.name}')"><i class="fa fa-times"></i></button>
      </div>
    `).join('');
  }
  
  function renderCatBudgets() {
    const container = document.getElementById('cat-budget-list');
    if (!container) return;
    const allCats = getAllCategories();
    const catBudgets = profile.categoryBudgets || {};
    container.innerHTML = allCats.map(c => `
      <div class="cat-budget-item">
        <label>${c.icon} ${c.name}</label>
        <input type="number" class="setting-input" placeholder="Limit"
          value="${catBudgets[c.name] || ''}"
          onchange="setCatBudget('${c.name}', this.value)"/>
      </div>
    `).join('');
  }
  
  function setCatBudget(name, val) {
    if (!profile.categoryBudgets) profile.categoryBudgets = {};
    const num = parseFloat(val);
    if (num > 0) profile.categoryBudgets[name] = num;
    else delete profile.categoryBudgets[name];
    saveProfile();
  }
  
  function renderMonthlyHistory() {
    const container = document.getElementById('monthly-history-list');
    if (!container) return;
    const months = Object.keys(archive).sort().reverse();
    if (months.length === 0) {
      container.innerHTML = `<p style="font-size:0.85rem;color:var(--text-muted)">No previous months yet.</p>`;
      return;
    }
    const cur = profile.currency || 'Rs';
    container.innerHTML = months.map(m => {
      const data = archive[m];
      const spent = (data.expenses||[]).reduce((s,e) => s+e.amount, 0);
      const budget = data.budget || 0;
      const saved = spent <= budget;
      const d = new Date(m + '-01');
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      return `
        <div class="monthly-history-item">
          <div>
            <div class="month-name">${label}</div>
            <div class="month-meta">Spent: ${formatCurrency(Math.round(spent), cur)} / Budget: ${formatCurrency(budget, cur)}</div>
          </div>
          <span class="month-badge ${saved ? 'saved' : 'over'}">${saved ? '✅ Saved' : '⚠️ Over'}</span>
        </div>
      `;
    }).join('');
  }
  
  async function resetAllData() {
    const ok = await confirmDialog('This will delete ALL your data. Are you sure?');
    if (!ok) return;
    expenses = []; saveExpenses();
    incomes = []; saveIncomes();
    badges = {}; saveBadges();
    archive = {}; saveArchive();
    profile.budget = 0;
    profile.savingsGoal = 0;
    profile.categoryBudgets = {};
    profile.customCategories = [];
    saveProfile();
    renderDashboard();
    showToast('All data reset', 'warning');
  }
  
  // ══════════════════════════════════════
  // EXPORT & SHARE
  // ══════════════════════════════════════
  function exportCSV() {
    const cur = profile.currency || 'Rs';
    const header = ['Date','Category','Amount','Note'].join(',');
    const rows = expenses.map(e =>
      [e.date, e.category, e.amount, '"' + (e.note||'').replace(/"/g,'""') + '"'].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses_' + getCurrentMonth() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported! 📊', 'success');
  }
  
  function printSummary() {
    window.print();
  }
  
  function copyWhatsApp() {
    const cur = profile.currency || 'Rs';
    const total = expenses.reduce((s,e) => s+e.amount, 0);
    const balance = (profile.budget || 0) + incomes.reduce((s,i) => s+i.amount, 0) - total;
    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  
    let text = `📊 *Expense Summary — ${month}*\n`;
    text += `Budget: ${formatCurrency(profile.budget||0, cur)}\n`;
    text += `Total Spent: ${formatCurrency(Math.round(total), cur)}\n`;
    text += `Balance: ${formatCurrency(Math.round(balance), cur)}\n\n`;
  
    const bycat = {};
    expenses.forEach(e => { bycat[e.category] = (bycat[e.category]||0) + e.amount; });
    text += `*By Category:*\n`;
    Object.entries(bycat).forEach(([k,v]) => { text += `• ${k}: ${formatCurrency(Math.round(v), cur)}\n`; });
    text += `\n_Tracked with Student Expense Manager_`;
  
    navigator.clipboard.writeText(text).then(() => {
      showToast('Summary copied! 📋', 'success');
    }).catch(() => {
      showToast('Copy failed — try again', 'error');
    });
  }
  
  // ══════════════════════════════════════
  // NOTIFICATIONS
  // ══════════════════════════════════════
  function toggleNotification(el) {
    if (el.checked) {
      if ('Notification' in window) {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            showToast('Daily reminders enabled! 🔔', 'success');
            localStorage.setItem('sxp_notif', '1');
          } else {
            el.checked = false;
            showToast('Permission denied', 'error');
          }
        });
      }
    } else {
      localStorage.removeItem('sxp_notif');
      showToast('Reminders disabled', 'warning');
    }
  }
  
  function checkAlerts() {
    const budget = profile.budget || 0;
    const total = expenses.reduce((s,e) => s+e.amount, 0);
    const pct = budget > 0 ? total / budget : 0;
    if (pct >= 0.9 && budget > 0) {
      showToast('🚨 Critical! Over 90% of budget used!', 'error');
    } else if (pct >= 0.7 && budget > 0) {
      showToast('⚠️ Warning! 70% of budget used', 'warning');
    }
    // Category alerts
    const catBudgets = profile.categoryBudgets || {};
    const allCats = getAllCategories();
    allCats.forEach(c => {
      if (catBudgets[c.name]) {
        const spent = expenses.filter(e => e.category === c.name).reduce((s,e) => s+e.amount, 0);
        if (spent > catBudgets[c.name]) {
          setTimeout(() => showToast(`⚠️ ${c.name} budget exceeded!`, 'warning'), 1500);
        }
      }
    });
  }
  
  // ══════════════════════════════════════
  // BADGES & SCORE
  // ══════════════════════════════════════
  function calcBadges() {
    if (expenses.length >= 1) badges.first_expense = true;
    if (profile.savingsGoal > 0) badges.budget_setter = true;
    if (calcStreak() >= 7) badges.streak_7 = true;
  
    const allCatsUsed = getAllCategories().every(c => expenses.find(e => e.category === c.name));
    if (allCatsUsed && expenses.length > 0) badges.all_rounder = true;
  
    const budget = profile.budget || 0;
    const total = expenses.reduce((s,e) => s+e.amount, 0);
    if (budget > 0 && total <= budget && getDaysPassedInMonth() >= 25) badges.budget_master = true;
  
    saveBadges();
  }
  
  function calcSpendingScore(pct) {
    let score = 100;
    if (pct >= 90) score -= 20;
    else if (pct >= 70) score -= 10;
  
    const catBudgets = profile.categoryBudgets || {};
    getAllCategories().forEach(c => {
      if (catBudgets[c.name]) {
        const spent = expenses.filter(e => e.category === c.name).reduce((s,e) => s+e.amount, 0);
        if (spent > catBudgets[c.name]) score -= 15;
      }
    });
  
    const streak = calcStreak();
    if (streak >= 5) score += 10;
  
    const goalProgress = profile.savingsGoal > 0
      ? Math.max(0, (profile.budget||0) + incomes.reduce((s,i)=>s+i.amount,0) - expenses.reduce((s,e)=>s+e.amount,0)) / profile.savingsGoal
      : 0;
    if (goalProgress >= 0.5) score += 10;
  
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  function calcStreak() {
    if (expenses.length === 0) return 0;
    const total = expenses.reduce((s,e) => s+e.amount, 0);
    const days = getDaysPassedInMonth();
    const avg = days > 0 ? total / days : 0;
    if (avg === 0) return 0;
  
    const byDay = {};
    expenses.forEach(e => { byDay[e.date] = (byDay[e.date]||0) + e.amount; });
  
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      if (byDay[ds] && byDay[ds] <= avg * 1.1) streak++;
      else if (i > 0) break;
    }
    return streak;
  }
  
  // ══════════════════════════════════════
  // THEME & PRIVACY
  // ══════════════════════════════════════
  function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('theme-icon').className = isDark ? 'fa fa-moon' : 'fa fa-sun';
    localStorage.setItem('sxp_theme', isDark ? 'light' : 'dark');
  }
  
  function toggleHideAmounts() {
    amountsHidden = !amountsHidden;
    document.getElementById('screen-app').classList.toggle('amounts-hidden', amountsHidden);
    document.getElementById('hide-icon').className = amountsHidden ? 'fa fa-eye-slash' : 'fa fa-eye';
  }
  
  // Apply saved theme
  (function applySavedTheme() {
    const t = localStorage.getItem('sxp_theme');
    if (t) {
      document.documentElement.setAttribute('data-theme', t);
      const icon = document.getElementById('theme-icon');
      if (icon) icon.className = t === 'dark' ? 'fa fa-sun' : 'fa fa-moon';
    }
  })();
  
  // ══════════════════════════════════════
  // PASSWORD TOGGLE
  // ══════════════════════════════════════
  function togglePassword(id, icon) {
    const input = document.getElementById(id);
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fa fa-eye-slash toggle-pw';
    } else {
      input.type = 'password';
      icon.className = 'fa fa-eye toggle-pw';
    }
  }
  
  // ══════════════════════════════════════
  // QUOTES
  // ══════════════════════════════════════
  function showDailyQuote() {
    const idx = new Date().getDate() % QUOTES.length;
    setText('daily-quote', QUOTES[idx]);
  }
  
  // ══════════════════════════════════════
  // CONFIRM DIALOG
  // ══════════════════════════════════════
  function confirmDialog(message) {
    return new Promise(resolve => {
      document.getElementById('confirm-message').textContent = message;
      document.getElementById('confirm-overlay').classList.remove('hidden');
      confirmCallback = resolve;
    });
  }
  function confirmResolve(result) {
    document.getElementById('confirm-overlay').classList.add('hidden');
    if (confirmCallback) confirmCallback(result);
  }
  
  // ══════════════════════════════════════
  // TOAST
  // ══════════════════════════════════════
  let toastTimeout;
  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
  }
  
  // ══════════════════════════════════════
  // UTILITIES
  // ══════════════════════════════════════
  function formatCurrency(amount, currency) {
    const cur = currency || profile.currency || 'Rs';
    const num = Number(amount || 0).toLocaleString();
    return cur + ' ' + num;
  }
  
  function formatDate(dateStr) {
    const today = todayString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth()+1).padStart(2,'0') + '-' + String(yesterday.getDate()).padStart(2,'0');
    if (dateStr === today) return 'Today';
    if (dateStr === yStr) return 'Yesterday';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('default', { day: 'numeric', month: 'short' });
  }
  
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning ☀️';
    if (h < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  }
  
  function getDaysPassedInMonth() {
    return new Date().getDate();
  }
  
  function getDaysInMonth() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  }
  
  function getAllCategories() {
    const custom = profile.customCategories || [];
    return [...DEFAULT_CATEGORIES, ...custom];
  }
  
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  
  function showSection(name) { showScreen(name); }