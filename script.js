document.addEventListener('DOMContentLoaded', () => {
    // --- Global Variables & DOM References ---
    let allData = []; // Holds all validated transaction data
    let currentPeriodType = 'all_periods'; // Default period type
    let currentTheme = localStorage.getItem('theme') || 'light'; // Default theme
    let currentYearFilter = 'all'; // Default year filter
    let currentCategoryFilter = 'all'; // Default category filter
    let currentDescriptionFilter = ''; // Default description filter
    let descriptionDebounceTimer; // Timer for description input debounce

    // --- DOM Element References ---
    // KPIs (Main)
    const kpiIncomeEl = document.getElementById('total-income');
    const kpiExpenseEl = document.getElementById('total-expense');
    const kpiNetEl = document.getElementById('net-cashflow');
    const kpiMarginEl = document.getElementById('net-margin');
    const kpiBadges = document.querySelectorAll('.period-badge'); // Badges on KPI cards

    // KPIs (Extra)
    const kpiTopExpenseCatEl = document.getElementById('top-expense-category');
    const kpiTopExpenseAmtEl = document.getElementById('top-expense-amount');
    const kpiTopIncomeCatEl = document.getElementById('top-income-category');
    const kpiTopIncomeAmtEl = document.getElementById('top-income-amount');
    const kpiEndingBalanceEl = document.getElementById('ending-balance');

    // Table
    const tableBodyEl = document.getElementById('transaction-table-body');
    const tablePeriodLabelEl = document.getElementById('table-period-label'); // Optional: Label above table

    // Filters & Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    const periodFilterRadios = document.querySelectorAll('input[name="period-filter"]');
    const yearFilterEl = document.getElementById('filter-year');
    const categoryFilterEl = document.getElementById('filter-category');
    const descriptionFilterEl = document.getElementById('filter-description');

    // Chart Canvas Elements (Ensure these IDs exist in your HTML)
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart')?.getContext('2d');
    const incomeExpensePieCtx = document.getElementById('incomeExpensePieChart')?.getContext('2d');
    const netCashflowTrendCtx = document.getElementById('netCashflowTrendChart')?.getContext('2d');
    const expenseCategoryCtx = document.getElementById('expenseCategoryChart')?.getContext('2d');
    const incomeCategoryCtx = document.getElementById('incomeCategoryChart')?.getContext('2d');
    const cumulativeBalanceCtx = document.getElementById('cumulativeBalanceChart')?.getContext('2d');

    // Chart instances
    let incomeExpenseChart = null;
    let incomeExpensePieChart = null;
    let netCashflowTrendChart = null;
    let expenseCategoryChart = null;
    let incomeCategoryChart = null;
    let cumulativeBalanceChart = null;

    // Store original chart titles (Can be removed if titles don't change anymore)
    // const originalChartTitles = {
    //     incomeExpense: 'Ingresos vs. Gastos por Período',
    //     netCashflowTrend: 'Tendencia del Flujo Neto de Caja (por Período)'
    // };


    // --- Initial Checks ---
    // Check if critical elements exist
    const essentialElements = [
        kpiIncomeEl, kpiExpenseEl, kpiNetEl, kpiMarginEl, tableBodyEl, themeToggleBtn,
        yearFilterEl, categoryFilterEl, descriptionFilterEl,
        kpiTopExpenseCatEl, kpiTopExpenseAmtEl, kpiTopIncomeCatEl, kpiTopIncomeAmtEl, kpiEndingBalanceEl,
        incomeExpenseCtx, incomeExpensePieCtx, netCashflowTrendCtx, expenseCategoryCtx, incomeCategoryCtx, cumulativeBalanceCtx // Check chart contexts too
    ];
    if (!essentialElements.every(el => el !== null) || periodFilterRadios.length === 0) {
        console.error("Error crítico: Uno o más elementos del DOM no se encontraron (KPIs, Tabla, Filtros, KPIs Extra, Canvas...). Verifica los IDs en index.html.");
        const errorContainer = document.createElement('div');
        errorContainer.className = 'alert alert-danger m-3';
        errorContainer.textContent = 'Error: No se pudo inicializar el dashboard. Faltan elementos HTML esenciales (incluyendo los canvas para los gráficos).';
        document.body.prepend(errorContainer);
        return; // Stop script execution
    }
    console.log("Todos los elementos esenciales del DOM encontrados.");

    // Check for Libraries
    if (typeof Chart === 'undefined') { console.error("Chart.js library is not loaded."); return; }
    if (typeof moment === 'undefined') { console.error("Moment.js library is not loaded."); return; }
    moment.locale('es'); // Set locale globally
    console.log("Libraries Chart.js and Moment.js loaded.");


    // --- Theme Colors & Management ---
    const themeColors = {
        light: {
            cardBg: '#ffffff', // Use white or f8f9fa
            text: '#495057', // Darker text for light theme
            grid: 'rgba(0, 0, 0, 0.1)',
            title: '#212529', // Even darker for titles
            success: 'rgba(25, 135, 84, 0.7)', successBorder: 'rgb(25, 135, 84)',
            danger: 'rgba(220, 53, 69, 0.7)', dangerBorder: 'rgb(220, 53, 69)',
            primary: 'rgb(13, 110, 253)', primaryBg: 'rgba(13, 110, 253, 0.1)',
            zero: 'rgb(255, 193, 7)', zeroLine: '#6c757d', // Grey for zero line
            pieSuccess: 'rgba(25, 135, 84, 0.8)', pieDanger: 'rgba(220, 53, 69, 0.8)',
            colorPalette: ['#0d6efd', '#6f42c1', '#d63384', '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0', '#adb5bd', '#6c757d', '#343a40', '#495057']
        },
        dark: {
            cardBg: '#2b3035', // Darker card background
            text: '#adb5bd', // Lighter text for dark theme
            grid: 'rgba(255, 255, 255, 0.1)',
            title: '#e9ecef', // Very light for titles
            success: 'rgba(40, 167, 69, 0.7)', successBorder: 'rgb(40, 167, 69)',
            danger: 'rgba(220, 53, 69, 0.7)', dangerBorder: 'rgb(220, 53, 69)',
            primary: 'rgb(52, 152, 219)', primaryBg: 'rgba(52, 152, 219, 0.1)',
            zero: 'rgb(241, 196, 15)', zeroLine: '#adb5bd', // Lighter grey for zero line
            pieSuccess: 'rgba(40, 167, 69, 0.8)', pieDanger: 'rgba(220, 53, 69, 0.8)',
            colorPalette: ['#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#1abc9c', '#34d3eb', '#95a5a6', '#bdc3c7', '#ecf0f1', '#7f8c8d']
        }
    };

    const updateChartDefaults = (theme) => {
        const colors = themeColors[theme];
        Chart.defaults.borderColor = colors.grid;
        Chart.defaults.color = colors.text;
        Chart.defaults.plugins = Chart.defaults.plugins || {};
        Chart.defaults.plugins.title = Chart.defaults.plugins.title || {};
        Chart.defaults.plugins.legend = Chart.defaults.plugins.legend || {};
        Chart.defaults.plugins.legend.labels = Chart.defaults.plugins.legend.labels || {};
        Chart.defaults.plugins.tooltip = Chart.defaults.plugins.tooltip || {};

        Chart.defaults.plugins.title.color = colors.title;
        Chart.defaults.plugins.legend.labels.color = colors.text;
        // Ensure tooltips match theme
        Chart.defaults.plugins.tooltip.titleColor = colors.title;
        Chart.defaults.plugins.tooltip.bodyColor = colors.text;
        Chart.defaults.plugins.tooltip.backgroundColor = theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';
        Chart.defaults.plugins.tooltip.borderColor = colors.grid;
        Chart.defaults.plugins.tooltip.borderWidth = 1;
    };

    const applyTheme = (theme) => {
        console.log(`Applying theme: ${theme}`);
        document.body.setAttribute('data-bs-theme', theme);
        themeToggleBtn.innerHTML = theme === 'dark'
            ? '<i class="fas fa-sun"></i> <span class="d-none d-lg-inline">Modo Claro</span>'
            : '<i class="fas fa-moon"></i> <span class="d-none d-lg-inline">Modo Oscuro</span>';

        updateChartDefaults(theme);
        localStorage.setItem('theme', theme);
        currentTheme = theme;

        if (allData && allData.length > 0) {
             filterAndRenderData();
        } else {
            console.log("Theme applied, but waiting for data to render.");
        }
    };

    // --- Utility Functions ---
    const formatCurrency = (value) => {
        const numValue = Number(value);
        if (isNaN(numValue)) {
            return '€ 0,00';
        }
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(numValue);
    };

    function debounce(func, delay) {
        return function(...args) {
            clearTimeout(descriptionDebounceTimer);
            descriptionDebounceTimer = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    // --- Data Fetching and Initial Population ---
    const fetchData = async () => {
        console.log('Attempting to fetch cashflow_data.json...');
        showLoadingMessage("Cargando datos iniciales...");
        try {
            const response = await fetch('cashflow_data.json');
            console.log('Fetch response status:', response.status);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}.`);

            const rawData = await response.json();
            if (!Array.isArray(rawData)) throw new Error("JSON data is not a valid array.");

            const validData = [];
            const years = new Set();
            const categories = new Set();

            rawData.forEach((item, index) => {
                const date = moment(item.date, "YYYY-MM-DD", true);
                const amount = parseFloat(item.amount);
                const type = typeof item.type === 'string' ? item.type.toLowerCase() : null;
                const category = typeof item.category === 'string' ? item.category.trim() : null;

                if (date.isValid() && !isNaN(amount) && (type === 'income' || type === 'expense') && category) {
                    validData.push({
                        date: date,
                        amount: amount,
                        type: type,
                        category: category,
                        description: typeof item.description === 'string' ? item.description : ''
                    });
                    years.add(date.year());
                    categories.add(category);
                } else {
                    console.warn(`Invalid or incomplete record skipped at index ${index}:`, item);
                }
            });

            if (validData.length === 0) {
                 throw new Error(rawData.length > 0 ? "No valid transaction records found after parsing." : "JSON data is empty.");
            }

            allData = validData;
            allData.sort((a, b) => a.date.valueOf() - b.date.valueOf());
            console.log("Datos cargados y procesados:", allData.length, "registros válidos.");

            populateYearFilter(years);
            populateCategoryFilter(categories);

            const checkedPeriodRadio = document.querySelector('input[name="period-filter"]:checked');
            if (checkedPeriodRadio) {
                currentPeriodType = checkedPeriodRadio.value;
                console.log(`Initial period type set to: ${currentPeriodType}`);
            }

            filterAndRenderData();

        } catch (error) {
            console.error("Error fetching, processing, or populating data:", error);
            showErrorMessage(`Error al cargar los datos: ${error.message}`);
            yearFilterEl.disabled = true;
            categoryFilterEl.disabled = true;
            descriptionFilterEl.disabled = true;
            periodFilterRadios.forEach(r => r.disabled = true);
        }
    };

    const populateYearFilter = (yearsSet) => {
        yearFilterEl.innerHTML = '<option value="all" selected>Todos los Años</option>';
        const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilterEl.appendChild(option);
        });
        console.log("Year filter populated.");
    };

    const populateCategoryFilter = (categoriesSet) => {
        categoryFilterEl.innerHTML = '<option value="all" selected>Todas las Categorías</option>';
        const sortedCategories = Array.from(categoriesSet).sort((a, b) => a.localeCompare(b));
        sortedCategories.forEach(cat => {
            if (cat) {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categoryFilterEl.appendChild(option);
            }
        });
        console.log("Category filter populated.");
    };

    // --- Filtering & Aggregation Logic ---
    const applyAllFilters = () => {
        let filtered = allData;
        if (currentYearFilter !== 'all') {
            const yearNum = parseInt(currentYearFilter);
            if (!isNaN(yearNum)) {
                filtered = filtered.filter(item => item.date.year() === yearNum);
            }
        }
        if (currentCategoryFilter !== 'all') {
            filtered = filtered.filter(item => item.category === currentCategoryFilter);
        }
        if (currentDescriptionFilter) {
            const searchTerm = currentDescriptionFilter.toLowerCase().trim();
            if (searchTerm) {
                filtered = filtered.filter(item => item.description && item.description.toLowerCase().includes(searchTerm));
            }
        }
        return filtered;
    };

    const getPeriodKey = (date, periodType) => {
        if (!moment.isMoment(date) || !date.isValid()) return "invalid-date";
        switch (periodType) {
            case 'monthly': return date.format('YYYY-MM');
            case 'quarterly': return `${date.year()}-Q${date.quarter()}`;
            case 'annual': return date.format('YYYY');
            default: return date.format('YYYY-MM');
        }
    };

    const getPeriodLabel = (key, periodType) => {
        switch (periodType) {
            case 'monthly': return moment(key, 'YYYY-MM', true).isValid() ? moment(key, 'YYYY-MM').format('MMMM YYYY') : `Mes Inválido (${key})`;
            case 'quarterly': return key.replace('-Q', ' Q');
            case 'annual': return moment(key, 'YYYY', true).isValid() ? key : `Año Inválido (${key})`;
            default: return key;
        }
    };

    // Aggregates data by MONTH, QUARTER, or YEAR (not used for 'all_periods')
    const aggregateDataByPeriod = (filteredByYCD, periodType) => {
        const aggregated = {};
        if (!filteredByYCD || filteredByYCD.length === 0) return [];

        filteredByYCD.forEach(item => {
            const periodKey = getPeriodKey(item.date, periodType);
            if (periodKey === "invalid-date") return;

            if (!aggregated[periodKey]) {
                let startDate;
                try { // Add try-catch for moment parsing robustness
                    if (periodType === 'monthly') startDate = moment(periodKey, 'YYYY-MM').startOf('month');
                    else if (periodType === 'quarterly') startDate = moment(item.date).startOf('quarter');
                    else if (periodType === 'annual') startDate = moment(periodKey, 'YYYY').startOf('year');
                    else startDate = moment(periodKey, 'YYYY-MM').startOf('month');

                    if (!moment.isMoment(startDate) || !startDate.isValid()) throw new Error('Invalid date');

                } catch (e) {
                     console.warn("Could not determine valid start date for key:", periodKey, "from date:", item.date);
                     return; // Skip if we can't sort
                }


                aggregated[periodKey] = {
                    key: periodKey,
                    label: getPeriodLabel(periodKey, periodType),
                    startDate: startDate,
                    income: 0,
                    expense: 0,
                    transactions: []
                };
            }

            const amount = typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0;
            if (item.type === 'income') {
                aggregated[periodKey].income += amount;
            } else if (item.type === 'expense') {
                aggregated[periodKey].expense += amount;
            }
            aggregated[periodKey].transactions.push(item);
        });

        const sortedAggregatedData = Object.values(aggregated).sort((a, b) => a.startDate.valueOf() - b.startDate.valueOf());
        return sortedAggregatedData;
    };

    // --- Rendering Functions ---

    const showLoadingMessage = (message) => {
        if (tableBodyEl) tableBodyEl.innerHTML = `<tr><td colspan="5" class="text-center p-5"><i class="fas fa-spinner fa-spin me-2"></i>${message}</td></tr>`;
    };
    const showErrorMessage = (message) => {
         if (tableBodyEl) tableBodyEl.innerHTML = `<tr><td colspan="5" class="text-center text-danger p-5"><i class="fas fa-exclamation-triangle me-2"></i>${message}</td></tr>`;
    };
     const showNoDataMessage = (chartCtx = null, message = "No hay datos disponibles.") => {
         if (tableBodyEl && !chartCtx) tableBodyEl.innerHTML = `<tr><td colspan="5" class="text-center p-5">${message}</td></tr>`;
         if(chartCtx) {
             const canvas = chartCtx.canvas;
             chartCtx.clearRect(0, 0, canvas.width, canvas.height);
             chartCtx.save();
             chartCtx.fillStyle = themeColors[currentTheme].text;
             chartCtx.textAlign = 'center';
             chartCtx.textBaseline = 'middle';
             chartCtx.font = '16px sans-serif';
             chartCtx.fillText(message, canvas.width / 2, canvas.height / 2);
             chartCtx.restore();
         }
     };

    const applyConditionalFormatting = (element, value, income = 0) => {
        if (!element) return;
        element.classList.remove('status-ok', 'status-warn', 'status-risk', 'value-update');
        void element.offsetWidth;

        let statusClass = '';
        const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.,-]+/g,"").replace(',','.'));

        if (isNaN(numericValue)) return;

        if (element.id === 'net-margin') {
            const marginPercent = income > 0 ? (numericValue / income) * 100 : (numericValue > 0 ? 100 : (numericValue < 0 ? -100 : 0));
            if (marginPercent > 15) statusClass = 'status-ok';
            else if (marginPercent >= 0) statusClass = 'status-warn';
            else statusClass = 'status-risk';
        } else if (element.id === 'net-cashflow' || element.id === 'ending-balance') {
            if (numericValue > 0) statusClass = 'status-ok';
            else if (numericValue === 0) statusClass = 'status-warn';
            else statusClass = 'status-risk';
        }

        if (statusClass) element.classList.add(statusClass);
        element.classList.add('value-update');
        setTimeout(() => { if (element) element.classList.remove('value-update'); }, 500);
    };

    // renderKPIs (Shows LATEST period OR Grand Total if 'all_periods' selected)
    const renderKPIs = (aggregatedData, filteredByYCD) => { // Now receives filteredByYCD too
        let displayIncome = 0;
        let displayExpense = 0;
        let displayLabel = 'N/A';

        if (currentPeriodType === 'all_periods') {
            // Calculate grand totals directly from filteredByYCD
             if (filteredByYCD && filteredByYCD.length > 0) {
                 displayIncome = filteredByYCD.reduce((sum, item) => sum + (item.type === 'income' ? (item.amount || 0) : 0), 0);
                 displayExpense = filteredByYCD.reduce((sum, item) => sum + (item.type === 'expense' ? (item.amount || 0) : 0), 0);
                 displayLabel = 'Total General';
             }
        } else {
            // Get data from the LAST period in the sorted aggregatedData array
            if (aggregatedData && aggregatedData.length > 0) {
                const latestPeriod = aggregatedData[aggregatedData.length - 1];
                displayIncome = latestPeriod.income || 0;
                displayExpense = latestPeriod.expense || 0;
                displayLabel = latestPeriod.label || 'Período Reciente';
            }
        }

        const displayNetCashflow = displayIncome - displayExpense;
        const displayNetMargin = displayIncome === 0 ? 0 : (displayNetCashflow / displayIncome) * 100;

        // Update DOM Elements
        if (kpiIncomeEl) kpiIncomeEl.textContent = formatCurrency(displayIncome);
        if (kpiExpenseEl) kpiExpenseEl.textContent = formatCurrency(displayExpense);
        if (kpiNetEl) kpiNetEl.textContent = formatCurrency(displayNetCashflow);
        if (kpiMarginEl) kpiMarginEl.textContent = `${displayNetMargin.toFixed(1)}%`;

        // Apply conditional formatting
        applyConditionalFormatting(kpiNetEl, displayNetCashflow);
        applyConditionalFormatting(kpiMarginEl, displayNetCashflow, displayIncome);

        // Update period badges
        kpiBadges.forEach(badge => {
            const parentCard = badge.closest('.kpi-card');
            if (!(parentCard && parentCard.querySelector('#ending-balance'))) {
                 badge.textContent = displayLabel !== 'N/A' ? displayLabel : 'Seleccionado';
            } else {
                 badge.textContent = 'Acumulado';
            }
        });
    };

    // renderExtraKPIs (Shows overall Top Categories based on YCD filters)
    const renderExtraKPIs = (filteredByYCD) => {
        if (!kpiTopExpenseCatEl || !kpiTopIncomeCatEl || !kpiTopExpenseAmtEl || !kpiTopIncomeAmtEl) {
            console.warn("One or more Extra KPI elements (Top Cat/Amt) not found.");
            if(kpiTopExpenseCatEl) kpiTopExpenseCatEl.textContent = '-';
            if(kpiTopExpenseAmtEl) kpiTopExpenseAmtEl.textContent = formatCurrency(0);
            if(kpiTopIncomeCatEl) kpiTopIncomeCatEl.textContent = '-';
            if(kpiTopIncomeAmtEl) kpiTopIncomeAmtEl.textContent = formatCurrency(0);
            return;
        }

        let topExpenseCat = '-'; let topExpenseAmt = 0;
        let topIncomeCat = '-'; let topIncomeAmt = 0;

        if (filteredByYCD && filteredByYCD.length > 0) {
            const categoryTotals = filteredByYCD.reduce((acc, item) => {
                    const cat = item.category || 'Sin Categoría';
                    const type = item.type;
                    const amount = typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0;
                    if (!acc[type]) acc[type] = {};
                    if (!acc[type][cat]) acc[type][cat] = 0;
                    acc[type][cat] += amount;
                    return acc;
                }, { income: {}, expense: {} });

            let maxExpense = 0;
            for (const cat in categoryTotals.expense) {
                if (categoryTotals.expense[cat] > maxExpense) { maxExpense = categoryTotals.expense[cat]; topExpenseCat = cat; topExpenseAmt = maxExpense; }
            }
            let maxIncome = 0;
            for (const cat in categoryTotals.income) {
                if (categoryTotals.income[cat] > maxIncome) { maxIncome = categoryTotals.income[cat]; topIncomeCat = cat; topIncomeAmt = maxIncome; }
            }
        }

        kpiTopExpenseCatEl.textContent = topExpenseCat;
        kpiTopExpenseAmtEl.textContent = formatCurrency(topExpenseAmt);
        kpiTopIncomeCatEl.textContent = topIncomeCat;
        kpiTopIncomeAmtEl.textContent = formatCurrency(topIncomeAmt);
    };

    // renderTable (Shows transactions based on YCD filters, sorted)
    const renderTable = (filteredByYCD) => { // Simplified to always use filteredByYCD
        if (!tableBodyEl) { console.error("Table body element not found"); return; }
        tableBodyEl.innerHTML = '';

        const transactionsToShow = filteredByYCD || [];

        if (transactionsToShow.length === 0) {
             if(tableBodyEl.innerHTML === '') {
                tableBodyEl.innerHTML = `<tr><td colspan="5" class="text-center p-5">No hay transacciones detalladas para mostrar.</td></tr>`;
             }
             return;
        }

        transactionsToShow.sort((a, b) => b.date.valueOf() - a.date.valueOf());

        transactionsToShow.forEach(item => {
            const row = document.createElement('tr');
            row.classList.add(`table-type-${item.type}`);
            const valueCellContent = formatCurrency(item.amount);
            let valueClass = item.type === 'income' ? 'text-success' : 'text-danger';

            row.innerHTML = `
                <td>${moment.isMoment(item.date) ? item.date.format('DD/MM/YYYY') : 'Fecha Inv.'}</td>
                 <td><span class="badge bg-${item.type === 'income' ? 'success' : 'danger'}">${item.type === 'income' ? 'Ingreso' : 'Gasto'}</span></td>
                <td>${item.category || 'N/A'}</td>
                <td>${item.description || ''}</td>
                <td class="${valueClass} text-end">${valueCellContent}</td>
            `;
            tableBodyEl.appendChild(row);
        });

        if (tablePeriodLabelEl) {
             let periodText = '';
             if (currentPeriodType === 'all_periods') periodText = 'General';
             else if (currentPeriodType === 'monthly') periodText = 'Mensual';
             else if (currentPeriodType === 'quarterly') periodText = 'Trimestral';
             else if (currentPeriodType === 'annual') periodText = 'Anual';

             const yearText = currentYearFilter === 'all' ? '' : ` del ${currentYearFilter}`;
             const catText = currentCategoryFilter === 'all' ? '' : ` (${currentCategoryFilter})`;
             tablePeriodLabelEl.textContent = `Detalle ${periodText}${yearText}${catText}`;
        }
    };

    // --- Chart Rendering Functions ---
    const destroyChart = (chartInstance) => {
        if (chartInstance) {
            chartInstance.destroy();
        }
        return null;
    };
    const destroyAllCharts = () => {
        incomeExpenseChart = destroyChart(incomeExpenseChart);
        incomeExpensePieChart = destroyChart(incomeExpensePieChart);
        netCashflowTrendChart = destroyChart(netCashflowTrendChart);
        expenseCategoryChart = destroyChart(expenseCategoryChart);
        incomeCategoryChart = destroyChart(incomeCategoryChart);
        cumulativeBalanceChart = destroyChart(cumulativeBalanceChart);
    }

    // *** UPDATED: Render Income vs Expense Bar Chart (Handles 'all_periods' data) ***
    const renderIncomeExpenseChart = (aggregatedData, filteredByYCD) => {
        if (!incomeExpenseCtx) { console.error("Income/Expense Bar Chart context not found"); return; }
        incomeExpenseChart = destroyChart(incomeExpenseChart); // Always destroy previous

        let chartLabels = [];
        let incomeDatasetData = [];
        let expenseDatasetData = [];
        let chartTitle = 'Ingresos vs. Gastos'; // Base title

        if (currentPeriodType === 'all_periods') {
            // Calculate grand totals from filteredByYCD
            if (filteredByYCD && filteredByYCD.length > 0) {
                const grandTotalIncome = filteredByYCD.reduce((sum, item) => sum + (item.type === 'income' ? (item.amount || 0) : 0), 0);
                const grandTotalExpense = filteredByYCD.reduce((sum, item) => sum + (item.type === 'expense' ? (item.amount || 0) : 0), 0);
                chartLabels = ['Total General'];
                incomeDatasetData = [grandTotalIncome];
                expenseDatasetData = [grandTotalExpense];
                chartTitle = 'Ingresos vs. Gastos (Total General)';
            } else {
                 // No data for 'all_periods' view
                 showNoDataMessage(incomeExpenseCtx);
                 return;
            }
        } else {
            // Use aggregated data for M/Q/A view
            if (!aggregatedData || aggregatedData.length === 0) {
                console.log("No data for Income/Expense Bar Chart (M/Q/A).");
                showNoDataMessage(incomeExpenseCtx);
                return;
            }
            chartLabels = aggregatedData.map(p => p.label);
            incomeDatasetData = aggregatedData.map(p => p.income || 0);
            expenseDatasetData = aggregatedData.map(p => p.expense || 0);
            chartTitle = 'Ingresos vs. Gastos por Período';
        }

        const colors = themeColors[currentTheme];
        incomeExpenseChart = new Chart(incomeExpenseCtx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: incomeDatasetData,
                        backgroundColor: colors.success,
                        borderColor: colors.successBorder,
                        borderWidth: 1
                    },
                    {
                        label: 'Gastos',
                        data: expenseDatasetData,
                        backgroundColor: colors.danger,
                        borderColor: colors.dangerBorder,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: chartTitle }, // Use dynamic title
                    tooltip: { mode: 'index', intersect: false, callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}` } }
                },
                scales: {
                    x: { stacked: false, grid: { color: colors.grid }, ticks: { color: colors.text } },
                    y: { stacked: false, grid: { color: colors.grid }, ticks: { color: colors.text, callback: (value) => formatCurrency(value) } }
                }
            }
        });
    };

    // Render Income/Expense Pie Chart (Shows overall proportion based on YCD filters)
    const renderIncomeExpensePieChart = (filteredByYCD) => {
        incomeExpensePieChart = destroyChart(incomeExpensePieChart);
        if (!incomeExpensePieCtx) { console.error("Income/Expense Pie Chart context not found"); return; }

        const colors = themeColors[currentTheme];
        let totalIncome = 0;
        let totalExpense = 0;

        if (filteredByYCD && filteredByYCD.length > 0) {
            totalIncome = filteredByYCD.reduce((sum, item) => sum + (item.type === 'income' ? (item.amount || 0) : 0), 0);
            totalExpense = filteredByYCD.reduce((sum, item) => sum + (item.type === 'expense' ? (item.amount || 0) : 0), 0);
        }

        if (totalIncome <= 0 && totalExpense <= 0) {
             showNoDataMessage(incomeExpensePieCtx);
             return;
        }

        incomeExpensePieChart = new Chart(incomeExpensePieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Ingresos Totales', 'Gastos Totales'],
                datasets: [{
                    data: [totalIncome, totalExpense],
                    backgroundColor: [colors.pieSuccess, colors.pieDanger],
                    borderColor: colors.cardBg,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Distribución Ingresos/Gastos (Total Filtrado)' },
                    legend: { position: 'bottom', labels: { color: colors.text } },
                    tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.raw)}` } }
                }
            }
        });
    };

    // *** UPDATED: Render Net Cashflow Trend Line Chart (Handles 'all_periods' data) ***
    const renderNetCashflowTrendChart = (aggregatedData, filteredByYCD) => {
        if (!netCashflowTrendCtx) { console.error("Net Cashflow Trend Chart context not found"); return; }
        netCashflowTrendChart = destroyChart(netCashflowTrendChart); // Always destroy previous

        let chartLabels = [];
        let netDatasetData = [];
        let chartTitle = 'Tendencia Flujo Neto'; // Base title

        if (currentPeriodType === 'all_periods') {
            // Aggregate filteredByYCD by YEAR for the trend
            if (filteredByYCD && filteredByYCD.length > 0) {
                const yearlyNet = {};
                filteredByYCD.forEach(item => {
                    const year = item.date.year();
                    if (!yearlyNet[year]) {
                        yearlyNet[year] = { income: 0, expense: 0 };
                    }
                    const amount = item.amount || 0;
                    if (item.type === 'income') yearlyNet[year].income += amount;
                    else yearlyNet[year].expense += amount;
                });

                const sortedYears = Object.keys(yearlyNet).sort((a, b) => a - b);
                if (sortedYears.length > 0) {
                    chartLabels = sortedYears;
                    netDatasetData = sortedYears.map(year => yearlyNet[year].income - yearlyNet[year].expense);
                    chartTitle = 'Tendencia Anual Flujo Neto (Vista General)';
                } else {
                    // No yearly data found within filtered results
                     showNoDataMessage(netCashflowTrendCtx);
                     return;
                }

            } else {
                 // No data for 'all_periods' view
                 showNoDataMessage(netCashflowTrendCtx);
                 return;
            }
        } else {
            // Use aggregated data for M/Q/A view
            if (!aggregatedData || aggregatedData.length === 0) {
                console.log("No data for Net Cashflow Trend Chart (M/Q/A).");
                showNoDataMessage(netCashflowTrendCtx);
                return;
            }
            chartLabels = aggregatedData.map(p => p.label);
            netDatasetData = aggregatedData.map(p => (p.income || 0) - (p.expense || 0));
            chartTitle = 'Tendencia del Flujo Neto de Caja (por Período)';
        }

        const colors = themeColors[currentTheme];
        netCashflowTrendChart = new Chart(netCashflowTrendCtx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Flujo Neto de Caja',
                    data: netDatasetData,
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryBg,
                    fill: true,
                    tension: 0.1,
                    pointBackgroundColor: netDatasetData.map(value => {
                        if (value > 0) return colors.successBorder;
                        if (value < 0) return colors.dangerBorder;
                        return colors.zero;
                    }),
                    pointBorderColor: colors.primary,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: chartTitle }, // Use dynamic title
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}` } }
                },
                scales: {
                    x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
                    y: {
                        grid: {
                            color: (context) => context.tick.value === 0 ? colors.zeroLine : colors.grid,
                            lineWidth: (context) => context.tick.value === 0 ? 2 : 1,
                        },
                        ticks: { color: colors.text, callback: (value) => formatCurrency(value) }
                    }
                }
            }
        });
    };

    // Render Expense Category Pie Chart (Shows overall distribution based on YCD filters)
    const renderExpenseCategoryChart = (filteredByYCD) => {
        expenseCategoryChart = destroyChart(expenseCategoryChart);
        if (!expenseCategoryCtx) { console.error("Expense Category Chart context not found"); return; }

        const colors = themeColors[currentTheme];
        const expenseTotals = {};
        let totalExpenses = 0;

        if (filteredByYCD && filteredByYCD.length > 0) {
             filteredByYCD
                .filter(t => t.type === 'expense')
                .forEach(t => {
                    const cat = t.category || 'Sin Categoría';
                    const amount = typeof t.amount === 'number' && !isNaN(t.amount) ? t.amount : 0;
                    expenseTotals[cat] = (expenseTotals[cat] || 0) + amount;
                    totalExpenses += amount;
                });
        }

        if (totalExpenses <= 0) {
            showNoDataMessage(expenseCategoryCtx);
            return;
        }

        const sortedCategories = Object.entries(expenseTotals).sort(([, a], [, b]) => b - a);
        const labels = sortedCategories.map(([cat]) => cat);
        const data = sortedCategories.map(([, amt]) => amt);

        expenseCategoryChart = new Chart(expenseCategoryCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: Array.from({ length: labels.length }, (_, i) => colors.colorPalette[i % colors.colorPalette.length]),
                    borderColor: colors.cardBg,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Distribución de Gastos por Categoría (Total Filtrado)' },
                    legend: { position: 'right', labels: { color: colors.text, boxWidth: 15 } },
                    tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.raw)} (${((context.raw / totalExpenses) * 100).toFixed(1)}%)` } }
                }
            }
        });
    };

    // Render Income Category Pie Chart (Shows overall distribution based on YCD filters)
    const renderIncomeCategoryChart = (filteredByYCD) => {
        incomeCategoryChart = destroyChart(incomeCategoryChart);
        if (!incomeCategoryCtx) { console.error("Income Category Chart context not found"); return; }

        const colors = themeColors[currentTheme];
        const incomeTotals = {};
        let totalIncomes = 0;

         if (filteredByYCD && filteredByYCD.length > 0) {
            filteredByYCD
                .filter(t => t.type === 'income')
                .forEach(t => {
                    const cat = t.category || 'Sin Categoría';
                     const amount = typeof t.amount === 'number' && !isNaN(t.amount) ? t.amount : 0;
                    incomeTotals[cat] = (incomeTotals[cat] || 0) + amount;
                    totalIncomes += amount;
                });
        }

        if (totalIncomes <= 0) {
            showNoDataMessage(incomeCategoryCtx);
            return;
        }

        const sortedCategories = Object.entries(incomeTotals).sort(([, a], [, b]) => b - a);
        const labels = sortedCategories.map(([cat]) => cat);
        const data = sortedCategories.map(([, amt]) => amt);

        incomeCategoryChart = new Chart(incomeCategoryCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: Array.from({ length: labels.length }, (_, i) => colors.colorPalette[(i + 3) % colors.colorPalette.length]),
                    borderColor: colors.cardBg,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Distribución de Ingresos por Categoría (Total Filtrado)' },
                    legend: { position: 'right', labels: { color: colors.text, boxWidth: 15 } },
                    tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.raw)} (${((context.raw / totalIncomes) * 100).toFixed(1)}%)` } }
                }
            }
        });
    };

    // Render Cumulative Balance Line Chart (Uses ALL data filtered by YCD - Unchanged)
    const renderCumulativeBalanceChart = (filteredByYCD) => {
        cumulativeBalanceChart = destroyChart(cumulativeBalanceChart);
        if (!cumulativeBalanceCtx) { console.error("Cumulative Balance Chart context not found"); return; }
        if (!filteredByYCD || filteredByYCD.length === 0) {
            if (kpiEndingBalanceEl) kpiEndingBalanceEl.textContent = formatCurrency(0);
            applyConditionalFormatting(kpiEndingBalanceEl, 0);
             showNoDataMessage(cumulativeBalanceCtx);
            return;
        }

        const colors = themeColors[currentTheme];
        const sortedData = [...filteredByYCD].sort((a, b) => a.date.valueOf() - b.date.valueOf());

        const labels = [];
        const cumulativeData = [];
        let runningBalance = 0;

        const dailyNet = new Map();
        sortedData.forEach(item => {
            const dayKey = item.date.format('YYYY-MM-DD');
            const amount = item.type === 'income' ? item.amount : -item.amount;
            dailyNet.set(dayKey, (dailyNet.get(dayKey) || 0) + amount);
        });

        const sortedDays = Array.from(dailyNet.keys()).sort();

        sortedDays.forEach(dayKey => {
            runningBalance += dailyNet.get(dayKey);
            labels.push(moment(dayKey, 'YYYY-MM-DD').format('DD/MM/YY'));
            cumulativeData.push(runningBalance);
        });

        const endingBalance = cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1] : 0;
        if (kpiEndingBalanceEl) kpiEndingBalanceEl.textContent = formatCurrency(endingBalance);
        applyConditionalFormatting(kpiEndingBalanceEl, endingBalance);

        cumulativeBalanceChart = new Chart(cumulativeBalanceCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Saldo Acumulado',
                    data: cumulativeData,
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryBg,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 2,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Evolución del Saldo Acumulado' },
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context) => `Saldo al ${context.label}: ${formatCurrency(context.raw)}` } }
                },
                scales: {
                    x: { grid: { color: colors.grid }, ticks: { color: colors.text, maxRotation: 45, minRotation: 45 } },
                    y: {
                        grid: {
                            color: (context) => context.tick.value === 0 ? colors.zeroLine : colors.grid,
                            lineWidth: (context) => context.tick.value === 0 ? 2 : 1,
                        },
                        ticks: { color: colors.text, callback: (value) => formatCurrency(value) }
                    }
                }
            }
        });
    };

    // --- Main Orchestration Function ---
    const filterAndRenderData = () => {
        // console.log(`--- Rendering Cycle Start ---`);
        // console.log(`Filters -> Period: ${currentPeriodType}, Year: ${currentYearFilter}, Cat: ${currentCategoryFilter}, Desc: "${currentDescriptionFilter}"`);

        // 1. Apply Year, Category, Description filters
        const filteredByYCD = applyAllFilters();
        // console.log(`Records after YCD filters: ${filteredByYCD.length}`);

        // 2. Aggregate data ONLY if needed (not for 'all_periods')
        let aggregatedData = [];
        if (currentPeriodType !== 'all_periods') {
            aggregatedData = aggregateDataByPeriod(filteredByYCD, currentPeriodType);
            // console.log(`Periods after aggregation (${currentPeriodType}): ${aggregatedData.length}`);
        }

        // 3. Check if there's any data based on YCD filters
        if (filteredByYCD.length === 0) {
             console.log("No data matches the YCD filter combination. Clearing visuals.");
             showNoDataMessage(null, "No hay transacciones que coincidan con los filtros seleccionados.");
             destroyAllCharts();
             renderKPIs([], []); // Pass empty arrays
             renderExtraKPIs([]);
             if (kpiEndingBalanceEl) kpiEndingBalanceEl.textContent = formatCurrency(0);
             applyConditionalFormatting(kpiEndingBalanceEl, 0);
             // console.log("--- Rendering Cycle End (No YCD Data) ---");
             return;
        }

        // 4. Render all components, passing the appropriate data
        renderKPIs(aggregatedData, filteredByYCD); // Needs both depending on mode
        renderExtraKPIs(filteredByYCD);
        renderTable(filteredByYCD); // Now always uses filteredByYCD
        renderIncomeExpenseChart(aggregatedData, filteredByYCD); // Needs both
        renderIncomeExpensePieChart(filteredByYCD);
        renderNetCashflowTrendChart(aggregatedData, filteredByYCD); // Needs both
        renderExpenseCategoryChart(filteredByYCD);
        renderIncomeCategoryChart(filteredByYCD);
        renderCumulativeBalanceChart(filteredByYCD);

        // console.log("--- Rendering Cycle End ---");
    };


    // --- Event Listeners ---
    themeToggleBtn.addEventListener('click', () => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    periodFilterRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value !== currentPeriodType) {
                 currentPeriodType = e.target.value;
                 filterAndRenderData();
            }
        });
    });

    yearFilterEl.addEventListener('change', (e) => {
        currentYearFilter = e.target.value;
        filterAndRenderData();
    });

    categoryFilterEl.addEventListener('change', (e) => {
        currentCategoryFilter = e.target.value;
        filterAndRenderData();
    });

    const debouncedFilterRender = debounce(filterAndRenderData, 400);
    descriptionFilterEl.addEventListener('input', (e) => {
        currentDescriptionFilter = e.target.value;
        debouncedFilterRender();
    });

    // --- Initialization ---
    applyTheme(currentTheme);
    fetchData();

}); // End DOMContentLoaded
